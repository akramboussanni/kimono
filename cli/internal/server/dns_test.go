package server

import (
	"os"
	"path/filepath"
	"testing"
)

func TestContainsAddress(t *testing.T) {
	if !containsAddress([]string{"192.0.2.1", "203.0.113.8"}, "203.0.113.8") {
		t.Fatal("expected address to match")
	}
	if containsAddress([]string{"192.0.2.1"}, "203.0.113.8") {
		t.Fatal("unexpected address match")
	}
}

func TestConfiguredDomains(t *testing.T) {
	home := t.TempDir()
	content := "AUTHENTIK_DOMAIN=accounts.example.com\nPG_PASS=secret\nMESH_DOMAIN=mesh.example.com\nKIMONO_PORTAL_DOMAIN=www.example.com\n"
	if err := os.WriteFile(filepath.Join(home, "server.env"), []byte(content), 0600); err != nil {
		t.Fatal(err)
	}
	manager := &Manager{Home: home}
	identity, mesh, portal, err := manager.configuredDomains()
	if err != nil {
		t.Fatal(err)
	}
	if identity != "accounts.example.com" || mesh != "mesh.example.com" || portal != "www.example.com" {
		t.Fatalf("unexpected domains: %q %q %q", identity, mesh, portal)
	}
}
