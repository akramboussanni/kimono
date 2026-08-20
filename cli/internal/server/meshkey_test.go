package server

import "testing"

func TestMeshKeyFromRecognisesHeadscaleOutput(t *testing.T) {
	cases := map[string]string{
		"bare":  "cmVzdWx0\nX1a2b3c4d5.9f8e7d6c5b4a39281706f5e4d3c2b1a0\n",
		"json":  "{\"key\":\"X1a2b3c4d5.9f8e7d6c5b4a39281706f5e4d3c2b1a0\"}\n",
		"noisy": "2026-08-19T21:00:00Z INF creating key\nX1a2b3c4d5.9f8e7d6c5b4a39281706f5e4d3c2b1a0\n",
	}
	for name, output := range cases {
		t.Run(name, func(t *testing.T) {
			if got := meshKeyFrom(output); got != "X1a2b3c4d5.9f8e7d6c5b4a39281706f5e4d3c2b1a0" {
				t.Fatalf("unexpected key %q", got)
			}
		})
	}
	if meshKeyFrom("no key here at all") != "" {
		t.Fatal("expected no key to be found")
	}
}
