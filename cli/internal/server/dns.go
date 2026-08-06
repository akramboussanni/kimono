package server

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

func (m *Manager) checkDNS(identityDomain, meshDomain, portalDomain string) error {
	if m.Runner.DryRun {
		_, _ = fmt.Fprintln(m.Runner.Stdout, "+ verify public IPv4 and DNS A records")
		return nil
	}
	publicIP, err := discoverPublicIPv4()
	if err != nil {
		return fmt.Errorf("determine this VM's public IPv4: %w", err)
	}
	_, _ = fmt.Fprintf(m.Runner.Stdout, "\nDNS preflight\nPublic IPv4: %s\n", publicIP)
	failed := false
	for _, domain := range []string{identityDomain, meshDomain, portalDomain} {
		addresses, lookupErr := lookupIPv4(domain)
		if lookupErr != nil {
			_, _ = fmt.Fprintf(m.Runner.Stdout, "✗ %s has no usable A record (%v)\n", domain, lookupErr)
			failed = true
			continue
		}
		if containsAddress(addresses, publicIP) {
			_, _ = fmt.Fprintf(m.Runner.Stdout, "✓ %s -> %s\n", domain, strings.Join(addresses, ", "))
			continue
		}
		_, _ = fmt.Fprintf(m.Runner.Stdout, "✗ %s -> %s (expected %s)\n", domain, strings.Join(addresses, ", "), publicIP)
		failed = true
	}
	if failed {
		return errors.New("DNS A records do not point to this VM; Cloudflare records must be DNS-only during setup, and mesh must remain DNS-only")
	}
	_, _ = fmt.Fprintln(m.Runner.Stdout, "✓ DNS is ready for HTTPS certificate issuance")
	_, _ = fmt.Fprintln(m.Runner.Stdout, "  Also forward TCP 80/443 and UDP 3478 through any router/firewall.")
	return nil
}

func discoverPublicIPv4() (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.ipify.org", nil)
	if err != nil {
		return "", err
	}
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("public IP service returned %s", response.Status)
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, 64))
	if err != nil {
		return "", err
	}
	value := strings.TrimSpace(string(data))
	ip := net.ParseIP(value)
	if ip == nil || ip.To4() == nil {
		return "", fmt.Errorf("public IP service returned invalid IPv4 %q", value)
	}
	return ip.String(), nil
}

func lookupIPv4(domain string) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	addresses, err := net.DefaultResolver.LookupIP(ctx, "ip4", domain)
	if err != nil {
		return nil, err
	}
	values := make([]string, 0, len(addresses))
	for _, address := range addresses {
		if ipv4 := address.To4(); ipv4 != nil {
			values = append(values, ipv4.String())
		}
	}
	if len(values) == 0 {
		return nil, errors.New("no A records found")
	}
	sort.Strings(values)
	return values, nil
}

func containsAddress(addresses []string, expected string) bool {
	for _, address := range addresses {
		if address == expected {
			return true
		}
	}
	return false
}

func (m *Manager) configuredDomains() (string, string, string, error) {
	values, err := readServerEnvironment(m.envPath())
	if err != nil {
		return "", "", "", fmt.Errorf("Kimono server is not installed; run `sudo kimono server install`: %w", err)
	}
	if values["AUTHENTIK_DOMAIN"] == "" || values["MESH_DOMAIN"] == "" || values["KIMONO_PORTAL_DOMAIN"] == "" {
		return "", "", "", errors.New("server configuration is missing a required public domain")
	}
	return values["AUTHENTIK_DOMAIN"], values["MESH_DOMAIN"], values["KIMONO_PORTAL_DOMAIN"], nil
}

func readServerEnvironment(path string) (map[string]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	values := map[string]string{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		parts := strings.SplitN(scanner.Text(), "=", 2)
		if len(parts) == 2 && parts[0] != "" && !strings.HasPrefix(parts[0], "#") {
			values[parts[0]] = strings.TrimSpace(parts[1])
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return values, nil
}
