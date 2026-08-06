package server

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/kimonoapps/kimono/cli/internal/system"
)

const cloudflareAPI = "https://api.cloudflare.com/client/v4"

type cloudflareConfig struct {
	Token    string   `json:"token"`
	ZoneID   string   `json:"zone_id"`
	ZoneName string   `json:"zone_name"`
	Records  []string `json:"records"`
}

type cloudflareClient struct {
	token   string
	baseURL string
	http    *http.Client
}

type cloudflareResponse[T any] struct {
	Success bool `json:"success"`
	Result  T    `json:"result"`
	Errors  []struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"errors"`
}

type cloudflareZone struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type cloudflareRecord struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Content string `json:"content"`
	Proxied bool   `json:"proxied"`
}

func (m *Manager) cloudflareDDNS(args []string) error {
	if len(args) == 0 {
		return errors.New("usage: kimono server cloudflare-ddns <setup|run|status|remove>")
	}
	switch args[0] {
	case "setup":
		return m.setupCloudflareDDNS(args[1:])
	case "run":
		return m.runCloudflareDDNS()
	case "status":
		return m.Runner.Run("systemctl", "status", "--no-pager", "kimono-cloudflare-ddns.timer")
	case "remove":
		return m.removeCloudflareDDNS()
	default:
		return fmt.Errorf("unknown cloudflare-ddns command %q", args[0])
	}
}

func (m *Manager) setupCloudflareDDNS(args []string) error {
	if err := system.RequireRoot(); err != nil {
		return err
	}
	flags := flag.NewFlagSet("server cloudflare-ddns setup", flag.ContinueOnError)
	zoneFlag := flags.String("zone", "", "Cloudflare DNS zone (normally example.com)")
	tokenFile := flags.String("token-file", "", "read the API token from a root-only file")
	if err := flags.Parse(args); err != nil {
		return err
	}
	identityDomain, meshDomain, err := m.configuredDomains()
	if err != nil {
		return err
	}
	token := ""
	if *tokenFile != "" {
		data, readErr := os.ReadFile(*tokenFile)
		if readErr != nil {
			return readErr
		}
		token = strings.TrimSpace(string(data))
	} else {
		_, _ = fmt.Fprintln(m.Runner.Stdout, "Create a Cloudflare API token limited to this zone with Zone:Read and DNS:Edit permissions.")
		token, err = readSecretFromTTY("Cloudflare API token: ")
		if err != nil {
			return err
		}
	}
	if token == "" {
		return errors.New("Cloudflare API token is required")
	}
	client := newCloudflareClient(token)
	if err := client.verifyToken(); err != nil {
		return fmt.Errorf("verify Cloudflare token: %w", err)
	}
	zone, err := client.findZone(identityDomain, *zoneFlag)
	if err != nil {
		return err
	}
	config := cloudflareConfig{Token: token, ZoneID: zone.ID, ZoneName: zone.Name, Records: []string{identityDomain, meshDomain}}
	if err := system.WriteJSON(m.cloudflareConfigPath(), config, 0600); err != nil {
		return err
	}
	if err := m.updateCloudflareRecords(config); err != nil {
		return err
	}
	if err := m.installCloudflareTimer(); err != nil {
		return err
	}
	_, _ = fmt.Fprintln(m.Runner.Stdout, "Cloudflare Dynamic DNS is active and will check every five minutes.")
	_, _ = fmt.Fprintln(m.Runner.Stdout, "Both Kimono records are managed as DNS-only A records.")
	return nil
}

func (m *Manager) runCloudflareDDNS() error {
	var config cloudflareConfig
	if err := system.ReadJSON(m.cloudflareConfigPath(), &config); err != nil {
		return fmt.Errorf("Cloudflare DDNS is not configured: %w", err)
	}
	return m.updateCloudflareRecords(config)
}

func (m *Manager) updateCloudflareRecords(config cloudflareConfig) error {
	publicIP, err := discoverPublicIPv4()
	if err != nil {
		return err
	}
	client := newCloudflareClient(config.Token)
	for _, record := range config.Records {
		changed, updateErr := client.upsertARecord(config.ZoneID, record, publicIP)
		if updateErr != nil {
			return updateErr
		}
		if changed {
			_, _ = fmt.Fprintf(m.Runner.Stdout, "Updated %s -> %s (DNS only)\n", record, publicIP)
		} else {
			_, _ = fmt.Fprintf(m.Runner.Stdout, "%s already points to %s\n", record, publicIP)
		}
	}
	return nil
}

func (m *Manager) installCloudflareTimer() error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}
	if strings.ContainsAny(executable, " \t\n") {
		return errors.New("Kimono executable path contains whitespace and cannot be used in a systemd unit")
	}
	unitDir := os.Getenv("KIMONO_SYSTEMD_DIR")
	if unitDir == "" {
		unitDir = "/etc/systemd/system"
	}
	service := fmt.Sprintf(`[Unit]
Description=Update Kimono Cloudflare DNS records
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=%s server cloudflare-ddns run
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
`, executable)
	timer := `[Unit]
Description=Run Kimono Cloudflare Dynamic DNS

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
RandomizedDelaySec=30s
Persistent=true

[Install]
WantedBy=timers.target
`
	if err := os.WriteFile(filepath.Join(unitDir, "kimono-cloudflare-ddns.service"), []byte(service), 0644); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(unitDir, "kimono-cloudflare-ddns.timer"), []byte(timer), 0644); err != nil {
		return err
	}
	if err := m.Runner.Run("systemctl", "daemon-reload"); err != nil {
		return err
	}
	return m.Runner.Run("systemctl", "enable", "--now", "kimono-cloudflare-ddns.timer")
}

func (m *Manager) removeCloudflareDDNS() error {
	if err := system.RequireRoot(); err != nil {
		return err
	}
	if err := m.Runner.Run("systemctl", "disable", "--now", "kimono-cloudflare-ddns.timer"); err != nil {
		return err
	}
	unitDir := os.Getenv("KIMONO_SYSTEMD_DIR")
	if unitDir == "" {
		unitDir = "/etc/systemd/system"
	}
	for _, name := range []string{"kimono-cloudflare-ddns.service", "kimono-cloudflare-ddns.timer"} {
		if err := os.Remove(filepath.Join(unitDir, name)); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	if err := os.Remove(m.cloudflareConfigPath()); err != nil && !os.IsNotExist(err) {
		return err
	}
	return m.Runner.Run("systemctl", "daemon-reload")
}

func newCloudflareClient(token string) *cloudflareClient {
	return &cloudflareClient{token: token, baseURL: cloudflareAPI, http: &http.Client{Timeout: 20 * time.Second}}
}

func (c *cloudflareClient) verifyToken() error {
	var result struct {
		Status string `json:"status"`
	}
	if err := c.request(http.MethodGet, "/user/tokens/verify", nil, &result); err != nil {
		return err
	}
	if result.Status != "active" {
		return fmt.Errorf("token status is %q", result.Status)
	}
	return nil
}

func (c *cloudflareClient) findZone(hostname, requested string) (cloudflareZone, error) {
	candidates := []string{}
	if requested != "" {
		candidates = append(candidates, strings.Trim(requested, "."))
	} else {
		labels := strings.Split(strings.Trim(hostname, "."), ".")
		for index := 1; index < len(labels)-1; index++ {
			candidates = append(candidates, strings.Join(labels[index:], "."))
		}
	}
	for _, candidate := range candidates {
		var zones []cloudflareZone
		if err := c.request(http.MethodGet, "/zones?name="+url.QueryEscape(candidate), nil, &zones); err != nil {
			return cloudflareZone{}, err
		}
		if len(zones) == 1 {
			return zones[0], nil
		}
	}
	return cloudflareZone{}, errors.New("could not find the Cloudflare zone; ensure the token has Zone:Read and use --zone if needed")
}

func (c *cloudflareClient) upsertARecord(zoneID, name, address string) (bool, error) {
	path := fmt.Sprintf("/zones/%s/dns_records?type=A&name=%s", url.PathEscape(zoneID), url.QueryEscape(name))
	var records []cloudflareRecord
	if err := c.request(http.MethodGet, path, nil, &records); err != nil {
		return false, err
	}
	body := map[string]any{"type": "A", "name": name, "content": address, "ttl": 1, "proxied": false, "comment": "Managed by Kimono Dynamic DNS"}
	if len(records) == 0 {
		var created cloudflareRecord
		return true, c.request(http.MethodPost, fmt.Sprintf("/zones/%s/dns_records", url.PathEscape(zoneID)), body, &created)
	}
	record := records[0]
	if record.Content == address && !record.Proxied {
		return false, nil
	}
	var updated cloudflareRecord
	path = fmt.Sprintf("/zones/%s/dns_records/%s", url.PathEscape(zoneID), url.PathEscape(record.ID))
	return true, c.request(http.MethodPatch, path, body, &updated)
}

func (c *cloudflareClient) request(method, path string, body any, result any) error {
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(data)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")
	response, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		return err
	}
	var envelope cloudflareResponse[json.RawMessage]
	if err := json.Unmarshal(data, &envelope); err != nil {
		return fmt.Errorf("Cloudflare returned %s: %w", response.Status, err)
	}
	if !envelope.Success || response.StatusCode < 200 || response.StatusCode >= 300 {
		messages := make([]string, 0, len(envelope.Errors))
		for _, apiErr := range envelope.Errors {
			messages = append(messages, fmt.Sprintf("%d: %s", apiErr.Code, apiErr.Message))
		}
		return fmt.Errorf("Cloudflare API %s: %s", response.Status, strings.Join(messages, "; "))
	}
	if result != nil {
		if err := json.Unmarshal(envelope.Result, result); err != nil {
			return err
		}
	}
	return nil
}

func readSecretFromTTY(label string) (string, error) {
	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	if err != nil {
		return "", errors.New("a terminal is required; use --token-file for unattended setup")
	}
	defer tty.Close()
	disableEcho := exec.Command("stty", "-echo")
	disableEcho.Stdin = tty
	if err := disableEcho.Run(); err != nil {
		return "", err
	}
	defer func() {
		enableEcho := exec.Command("stty", "echo")
		enableEcho.Stdin = tty
		_ = enableEcho.Run()
		_, _ = fmt.Fprintln(tty)
	}()
	_, _ = fmt.Fprint(tty, label)
	value, err := bufio.NewReader(tty).ReadString('\n')
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(value), nil
}

func (m *Manager) cloudflareConfigPath() string {
	return filepath.Join(m.Home, "cloudflare-ddns.json")
}
