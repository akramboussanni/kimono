package server

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/kimonoapps/kimono/cli/internal/system"
)

func TestEnsureServerEnvironmentDerivesMissingKeys(t *testing.T) {
	home := t.TempDir()
	existing := strings.Join([]string{
		"AUTHENTIK_DOMAIN=accounts.example.com",
		"MESH_DOMAIN=mesh.example.com",
		"KIMONO_PORTAL_DOMAIN=kimono.example.com",
		"ACME_EMAIL=admin@example.com",
		"PG_PASS=existing-password",
	}, "\n") + "\n"
	path := filepath.Join(home, "server.env")
	if err := os.WriteFile(path, []byte(existing), 0600); err != nil {
		t.Fatal(err)
	}
	manager := &Manager{Home: home, Runner: system.NewRunner()}
	if err := manager.ensureServerEnvironment(); err != nil {
		t.Fatal(err)
	}
	values, err := readServerEnvironment(path)
	if err != nil {
		t.Fatal(err)
	}
	if values["KIMONO_BASE_DOMAIN"] != "example.com" {
		t.Fatalf("expected the base domain to be derived, got %q", values["KIMONO_BASE_DOMAIN"])
	}
	if values["KIMONO_PORTAL_OIDC_REDIRECT_URI"] != "https://kimono.example.com/api/auth/callback/authentik" {
		t.Fatalf("unexpected portal redirect %q", values["KIMONO_PORTAL_OIDC_REDIRECT_URI"])
	}
	if values["PG_PASS"] != "existing-password" {
		t.Fatal("expected existing values to be preserved")
	}
	for _, key := range requiredEnvironment {
		if values[key] == "" {
			t.Fatalf("%s is still missing", key)
		}
	}

	// A second run must be a no-op, not a fresh set of secrets.
	before := values["KIMONO_PORTAL_SESSION_SECRET"]
	if err := manager.ensureServerEnvironment(); err != nil {
		t.Fatal(err)
	}
	after, err := readServerEnvironment(path)
	if err != nil {
		t.Fatal(err)
	}
	if after["KIMONO_PORTAL_SESSION_SECRET"] != before {
		t.Fatal("expected generated secrets to be stable across runs")
	}
}

func TestBaseDomainOf(t *testing.T) {
	for hostname, expected := range map[string]string{
		"kimono.example.com": "example.com",
		"example.com":        "example.com",
		"a.b.c.example.com":  "b.c.example.com",
	} {
		if got := baseDomainOf(hostname); got != expected {
			t.Fatalf("%s: expected %q, got %q", hostname, expected, got)
		}
	}
}
