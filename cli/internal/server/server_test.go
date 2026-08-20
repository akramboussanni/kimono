package server

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/kimonoapps/kimono/cli/internal/system"
)

func TestExtractApplianceMakesBindMountsTraversable(t *testing.T) {
	home := t.TempDir()
	manager := &Manager{Home: home, Runner: &system.Runner{}}
	if err := manager.extractAppliance(); err != nil {
		t.Fatal(err)
	}
	// Authentik and the Portal read these as non-root users.
	for _, directory := range []string{
		filepath.Join("authentik", "custom-templates"),
		"app-definitions",
	} {
		info, err := os.Stat(filepath.Join(home, "server", directory))
		if err != nil {
			t.Fatal(err)
		}
		if got := info.Mode().Perm(); got != 0755 {
			t.Fatalf("%s permissions = %o, expected 755", directory, got)
		}
	}
}

func TestPreservedOrRandom(t *testing.T) {
	called := false
	value, err := preservedOrRandom(map[string]string{"SECRET": "keep-me"}, "SECRET", func() (string, error) {
		called = true
		return "new", nil
	})
	if err != nil || value != "keep-me" || called {
		t.Fatalf("value=%q called=%v err=%v", value, called, err)
	}
}

func TestEnrollmentTag(t *testing.T) {
	for role, expected := range map[string]string{
		"node":  "tag:kimono-node",
		"ADMIN": "tag:kimono-admin",
	} {
		got, err := enrollmentTag(role)
		if err != nil || got != expected {
			t.Fatalf("enrollmentTag(%q) = %q, %v; expected %q", role, got, err, expected)
		}
	}
	if _, err := enrollmentTag("owner"); err == nil {
		t.Fatal("expected unsupported enrollment role to fail")
	}
}

func TestQualifyHostname(t *testing.T) {
	for _, test := range []struct {
		value, fallback, base, expected string
	}{
		{"", "notes", "example.com", "notes.example.com"},
		{"family", "notes", "example.com", "family.example.com"},
		{"notes.other.test", "notes", "example.com", "notes.other.test"},
		{"@", "portal", "example.com", "example.com"},
	} {
		if got := qualifyHostname(test.value, test.fallback, test.base); got != test.expected {
			t.Fatalf("qualifyHostname(%q) = %q, expected %q", test.value, got, test.expected)
		}
	}
}
