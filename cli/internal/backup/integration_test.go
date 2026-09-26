package backup

import (
	"bufio"
	"context"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// Set KIMONO_TEST_RESTIC to a restic binary to exercise real encryption,
// snapshot paths, selective restore, and the worker's verification command.
func TestResticRoundTrip(t *testing.T) {
	binary := os.Getenv("KIMONO_TEST_RESTIC")
	if binary == "" {
		t.Skip("set KIMONO_TEST_RESTIC for encrypted round-trip test")
	}
	w, c := fixture(t)
	repository := filepath.Join(t.TempDir(), "repository")
	content := []byte(`{"oauth":{"clientSecret":"test-secret"}}`)
	source := filepath.Join(w.Home, "apps", "apps", "immich-settings.json")
	if err := os.WriteFile(source, content, 0600); err != nil {
		t.Fatal(err)
	}
	item := Item{ID: "immich/config", AppID: "immich", Method: "settings", Default: true, Active: true}
	if err := writeJSON(filepath.Join(w.State, "deployment", "plan.json"), Plan{Items: []Item{item}}, 0600); err != nil {
		t.Fatal(err)
	}
	w.Command = func(ctx context.Context, name string, args, env []string, dir string, out io.Writer) error {
		if name != "restic" {
			t.Fatalf("unexpected command %s", name)
		}
		for i, value := range env {
			if strings.HasPrefix(value, "RESTIC_REPOSITORY=") {
				env[i] = "RESTIC_REPOSITORY=" + repository
			}
		}
		return execute(ctx, binary, args, env, dir, out)
	}
	var status Status
	if err := w.perform(context.Background(), c, Request{Action: "backup"}, &status); err != nil {
		t.Fatal(err)
	}
	if len(status.Snapshots) != 1 {
		t.Fatalf("expected snapshot: %+v", status)
	}
	if err := w.perform(context.Background(), c, Request{Action: "restore", Snapshot: status.Snapshots[0].ID, AppID: "immich"}, &status); err != nil {
		t.Fatal(err)
	}
	restored, err := os.ReadFile(filepath.Join(status.RestorePath, "apps", "immich", "config.json"))
	if err != nil {
		t.Fatal(err)
	}
	if string(restored) != string(content) {
		t.Fatal("restored data differs")
	}
	if _, err := os.Stat(filepath.Join(status.RestorePath, "manifest.json")); err != nil {
		t.Fatal(err)
	}
	cmd := exec.Command(binary, "-r", repository, "snapshots")
	cmd.Env = append(os.Environ(), "RESTIC_PASSWORD=wrong-password")
	if cmd.Run() == nil {
		t.Fatal("repository readable without correct password")
	}
}

func TestSQLiteOnlineExportWithWAL(t *testing.T) {
	if _, err := exec.LookPath("sqlite3"); err != nil {
		t.Skip("sqlite3 not installed")
	}
	w, _ := fixture(t)
	root := t.TempDir()
	database := filepath.Join(root, "live.sqlite")
	// Keep a live connection open so committed records remain in the WAL rather
	// than being checkpointed by closing the last connection.
	writer := exec.Command("sqlite3", database)
	input, err := writer.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	output, err := writer.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	if err := writer.Start(); err != nil {
		t.Fatal(err)
	}
	defer func() { input.Close(); writer.Wait() }()
	if _, err := io.WriteString(input, "PRAGMA journal_mode=WAL;\nPRAGMA wal_autocheckpoint=0;\nCREATE TABLE records(value TEXT);\nINSERT INTO records VALUES ('committed in WAL');\n.print READY\n"); err != nil {
		t.Fatal(err)
	}
	scanner := bufio.NewScanner(output)
	ready := false
	for scanner.Scan() {
		if scanner.Text() == "READY" {
			ready = true
			break
		}
	}
	if !ready {
		t.Fatal("SQLite writer did not become ready")
	}
	if _, err := os.Stat(database + "-wal"); err != nil {
		t.Fatal("expected live WAL", err)
	}
	w.Command = func(ctx context.Context, name string, args, env []string, dir string, out io.Writer) error {
		if name != "docker" {
			t.Fatal("unexpected command")
		}
		if args[0] == "volume" {
			return nil
		}
		for index, arg := range args {
			if arg == "-ec" {
				script := strings.ReplaceAll(args[index+1], "/source/", root+"/")
				script = strings.ReplaceAll(script, "/tmp/backup.sqlite", filepath.Join(root, "export.sqlite"))
				return execute(ctx, "sh", append([]string{"-ec", script}, args[index+2:]...), nil, "", out)
			}
		}
		t.Fatal("helper script missing")
		return nil
	}
	destination := filepath.Join(root, "result.sqlite")
	if err := w.capture(context.Background(), Item{Method: "sqlite", Volume: "fixture", Paths: []string{"live.sqlite"}}, destination); err != nil {
		t.Fatal(err)
	}
	actual, err := exec.Command("sqlite3", destination, "SELECT value FROM records;").Output()
	if err != nil {
		t.Fatal(err)
	}
	if strings.TrimSpace(string(actual)) != "committed in WAL" {
		t.Fatalf("WAL data lost: %s", actual)
	}
}
