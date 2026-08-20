package node

import "testing"

func TestParseConvenienceTargets(t *testing.T) {
	dockerTarget, err := parseTarget("notes:3000")
	if err != nil || dockerTarget.Service != "http://notes:3000" {
		t.Fatalf("unexpected Docker target: %#v %v", dockerTarget, err)
	}
	hostTarget, err := parseTarget("8080")
	if err != nil || hostTarget.Service != "http://host.docker.internal:8080" {
		t.Fatalf("unexpected host target: %#v %v", hostTarget, err)
	}
}

func TestSlug(t *testing.T) {
	if got := slug("  Kitchen Laptop  "); got != "kitchen-laptop" {
		t.Fatalf("unexpected slug %q", got)
	}
}

func TestValidateEnrollmentKey(t *testing.T) {
	if err := validateEnrollmentKey("hskey-auth-example-prefix-example-secret"); err != nil {
		t.Fatal(err)
	}
	for _, value := range []string{"", "not-a-key", "hskey-auth-short"} {
		if err := validateEnrollmentKey(value); err == nil {
			t.Fatalf("expected %q to be rejected", value)
		}
	}
}
