package backup

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

type RecoveryKit struct {
	Format         string `json:"format"`
	Repository     string `json:"repository"`
	Password       string `json:"password"`
	KeyID          string `json:"keyId"`
	ApplicationKey string `json:"applicationKey"`
}

// ImportKit restores repository access without minting a different encryption
// password. Scheduling stays disabled until the administrator reviews coverage.
func (w *Worker) ImportKit(file string) error {
	var kit RecoveryKit
	if err := readJSON(file, &kit); err != nil {
		return err
	}
	if kit.Format != "kimono-recovery-v1" || !strings.HasPrefix(kit.Repository, "s3:https://") {
		return fmt.Errorf("unsupported recovery kit")
	}
	u, err := url.Parse(strings.TrimPrefix(kit.Repository, "s3:"))
	if err != nil {
		return err
	}
	parts := strings.Split(strings.TrimPrefix(u.Path, "/"), "/")
	if len(parts) != 2 || u.User != nil || u.RawQuery != "" || u.Fragment != "" {
		return fmt.Errorf("invalid recovery repository")
	}
	c := Config{Version: 1, Endpoint: u.Scheme + "://" + u.Host, Bucket: parts[0], Prefix: parts[1], KeyID: kit.KeyID, ApplicationKey: kit.ApplicationKey, Password: kit.Password, RecoverySaved: true, HourUTC: 3, Daily: 7, Weekly: 4, Monthly: 6, Platform: true, Apps: map[string]bool{}, Items: map[string]bool{}}
	if err := c.Validate(); err != nil {
		return err
	}
	return w.locked(func() error {
		target := filepath.Join(w.dir(), "config.json")
		if err := writeJSON(target, c, 0600); err != nil {
			return err
		}
		// A root CLI import must leave settings editable/readable by the Portal's
		// existing state owner, without making credentials world-readable.
		if os.Geteuid() == 0 {
			info, err := os.Stat(w.State)
			if err != nil {
				return err
			}
			owner, ok := info.Sys().(*syscall.Stat_t)
			if !ok {
				return fmt.Errorf("cannot determine Portal state owner")
			}
			for _, path := range []string{w.dir(), target} {
				if err := os.Chown(path, int(owner.Uid), int(owner.Gid)); err != nil {
					return err
				}
			}
		}
		status := Status{State: "ready", Message: "Recovery access imported. Scheduling is paused; check stored data to load the snapshot list."}
		return w.saveStatus(&status)
	})
}
