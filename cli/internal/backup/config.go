// Package backup runs encrypted, online backups without stopping app containers.
package backup

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type Config struct {
	Version        int             `json:"version"`
	Enabled        bool            `json:"enabled"`
	Endpoint       string          `json:"endpoint"`
	Bucket         string          `json:"bucket"`
	Prefix         string          `json:"prefix"`
	KeyID          string          `json:"keyId"`
	ApplicationKey string          `json:"applicationKey"`
	Password       string          `json:"password"`
	RecoverySaved  bool            `json:"recoverySaved"`
	HourUTC        int             `json:"hourUTC"`
	Daily          int             `json:"daily"`
	Weekly         int             `json:"weekly"`
	Monthly        int             `json:"monthly"`
	Platform       bool            `json:"platform"`
	Apps           map[string]bool `json:"apps"`
	Items          map[string]bool `json:"items"`
}

type Item struct {
	ID          string   `json:"id"`
	AppID       string   `json:"appId"`
	AppName     string   `json:"appName"`
	Label       string   `json:"label"`
	Description string   `json:"description"`
	Method      string   `json:"method"`
	Volume      string   `json:"volume,omitempty"`
	Service     string   `json:"service,omitempty"`
	Paths       []string `json:"paths,omitempty"`
	Exclude     []string `json:"exclude,omitempty"`
	Database    string   `json:"database,omitempty"`
	Username    string   `json:"username,omitempty"`
	Default     bool     `json:"enabledByDefault"`
	Active      bool     `json:"active"`
	Version     string   `json:"version"`
}

type Plan struct {
	Items   []Item `json:"backupItems"`
	Compose struct {
		Services map[string]struct {
			Image string `json:"image"`
		} `json:"services"`
	} `json:"compose"`
}

type Request struct {
	ID       string `json:"id"`
	Action   string `json:"action"`
	Snapshot string `json:"snapshot"`
	AppID    string `json:"appId"`
}

type Snapshot struct {
	ID      string `json:"id"`
	Time    string `json:"time"`
	Summary *struct {
		Bytes int64 `json:"total_bytes_processed"`
	} `json:"summary,omitempty"`
}

type Status struct {
	State       string     `json:"state"`
	Message     string     `json:"message"`
	UpdatedAt   string     `json:"updatedAt"`
	LastSuccess string     `json:"lastSuccess,omitempty"`
	LastAttempt string     `json:"lastAttempt,omitempty"`
	LastCheck   string     `json:"lastCheck,omitempty"`
	RestorePath string     `json:"restorePath,omitempty"`
	Snapshots   []Snapshot `json:"snapshots,omitempty"`
}

var slug = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,63}$`)
var dbName = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
var snapshotID = regexp.MustCompile(`^[a-f0-9]{64}$`)
var relative = regexp.MustCompile(`^[a-zA-Z0-9_./*-]+$`)

func (c Config) Validate() error {
	if c.Version != 1 || !regexp.MustCompile(`^https://s3\.[a-z0-9-]+\.backblazeb2\.com$`).MatchString(c.Endpoint) || !regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9-]{4,62}$`).MatchString(c.Bucket) || !regexp.MustCompile(`^[a-zA-Z0-9_-]+$`).MatchString(c.Prefix) {
		return fmt.Errorf("invalid B2 destination")
	}
	if c.KeyID == "" || c.ApplicationKey == "" || len(c.Password) < 32 || strings.ContainsAny(c.KeyID+c.ApplicationKey+c.Password, "\r\n\x00") {
		return fmt.Errorf("backup credentials are missing or invalid")
	}
	if !c.RecoverySaved {
		return fmt.Errorf("save your recovery kit before running backups")
	}
	if c.HourUTC < 0 || c.HourUTC > 23 || c.Daily < 1 || c.Daily > 365 || c.Weekly < 1 || c.Weekly > 104 || c.Monthly < 1 || c.Monthly > 120 {
		return fmt.Errorf("invalid backup schedule or retention")
	}
	return nil
}

func (c Config) Repository() string { return "s3:" + c.Endpoint + "/" + c.Bucket + "/" + c.Prefix }
func (c Config) Selected(item Item) bool {
	if enabled, exists := c.Apps[item.AppID]; exists && !enabled {
		return false
	}
	if _, exists := c.Apps[item.AppID]; !exists && !item.Active {
		return false
	}
	if enabled, exists := c.Items[item.ID]; exists {
		return enabled
	}
	return item.Default
}

func (i Item) Validate() error {
	parts := strings.Split(i.ID, "/")
	if len(parts) != 2 || !slug.MatchString(i.AppID) || parts[0] != i.AppID || !slug.MatchString(parts[1]) {
		return fmt.Errorf("invalid backup item ID")
	}
	switch i.Method {
	case "files", "sqlite":
		prefix := "kimono-apps_" + i.AppID + "-"
		if !strings.HasPrefix(i.Volume, prefix) || !slug.MatchString(strings.TrimPrefix(i.Volume, prefix)) {
			return fmt.Errorf("%s: volume is outside this app", i.ID)
		}
		if len(i.Paths) == 0 || (i.Method == "sqlite" && len(i.Paths) != 1) {
			return fmt.Errorf("%s: missing source paths", i.ID)
		}
		for _, p := range append(append([]string{}, i.Paths...), i.Exclude...) {
			if !relative.MatchString(p) || strings.HasPrefix(p, "/") || strings.HasPrefix(p, "-") || path.Clean(p) != p || p == ".." || strings.HasPrefix(p, "../") {
				return fmt.Errorf("%s: unsafe source path", i.ID)
			}
		}
		if i.Method == "sqlite" && strings.Contains(i.Paths[0], "*") {
			return fmt.Errorf("SQLite path cannot contain wildcards")
		}
	case "postgres":
		if !strings.HasPrefix(i.Service, i.AppID+"-") || !slug.MatchString(i.Service) || !dbName.MatchString(i.Database) || !dbName.MatchString(i.Username) {
			return fmt.Errorf("%s: invalid database source", i.ID)
		}
	case "settings":
	default:
		return fmt.Errorf("%s: unsupported backup method", i.ID)
	}
	return nil
}

func Due(c Config, s Status, now time.Time) bool {
	if !c.Enabled {
		return false
	}
	now = now.UTC()
	scheduled := time.Date(now.Year(), now.Month(), now.Day(), c.HourUTC, 0, 0, 0, time.UTC)
	if now.Before(scheduled) {
		return false
	}
	success, _ := time.Parse(time.RFC3339, s.LastSuccess)
	attempt, _ := time.Parse(time.RFC3339, s.LastAttempt)
	return success.Before(scheduled) && now.Sub(attempt) >= time.Hour
}

func readJSON(file string, value any) error {
	data, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, value)
}
func writeJSON(file string, value any, mode os.FileMode) error {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(file), ".backup-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if err = f.Chmod(mode); err == nil {
		_, err = f.Write(append(data, '\n'))
	}
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	return os.Rename(f.Name(), file)
}
