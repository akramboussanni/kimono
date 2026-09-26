package server

import (
	"context"
	"flag"
	"fmt"
	"path/filepath"

	"github.com/kimonoapps/kimono/cli/internal/backup"
	"github.com/kimonoapps/kimono/cli/internal/system"
)

func (m *Manager) encryptedBackup(args []string) error {
	if err := system.RequireRoot(); err != nil {
		return err
	}
	if args[0] == "import-kit" {
		if len(args) != 2 {
			return fmt.Errorf("usage: kimono server backup import-kit /path/to/kimono-recovery-kit.json")
		}
		if m.Runner.DryRun {
			_, err := fmt.Fprintln(m.Runner.Stdout, "Would import backup repository access with scheduling paused.")
			return err
		}
		worker := backup.New(m.Home, filepath.Dir(m.reconcilePaths().DeploymentDir))
		if err := worker.ImportKit(args[1]); err != nil {
			return err
		}
		_, err := fmt.Fprintln(m.Runner.Stdout, "Recovery kit imported. Scheduling is paused; review Admin → Backups before enabling it.")
		return err
	}
	flags := flag.NewFlagSet("server backup "+args[0], flag.ContinueOnError)
	snapshot := flags.String("snapshot", "", "full snapshot ID to restore")
	app := flags.String("app", "", "restore only this app into the recovery directory")
	if err := flags.Parse(args[1:]); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("unexpected backup arguments")
	}
	action := args[0]
	if action == "run" {
		action = "backup"
	}
	if m.Runner.DryRun {
		_, err := fmt.Fprintf(m.Runner.Stdout, "Would run encrypted backup operation: %s\n", action)
		return err
	}
	worker := backup.New(m.Home, filepath.Dir(m.reconcilePaths().DeploymentDir))
	if err := worker.Run(context.Background(), backup.Request{Action: action, Snapshot: *snapshot, AppID: *app}); err != nil {
		return err
	}
	_, err := fmt.Fprintln(m.Runner.Stdout, "Backup operation finished. See Admin → Backups for the result and recovery directory.")
	return err
}
