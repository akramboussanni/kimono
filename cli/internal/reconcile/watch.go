package reconcile

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"time"
)

// Watch applies the published plan whenever it changes and retries after a
// failure, so an administrator only ever presses Save in the Portal.
func (r *Reconciler) Watch(ctx context.Context, interval, retry time.Duration) error {
	applied := ""
	nextRetry := time.Time{}
	for {
		current, err := fingerprint(r.Paths.PlanPath())
		switch {
		case err != nil:
			// The Portal has not published a plan yet; keep waiting quietly.
		case current != applied:
			_, _ = fmt.Fprintln(r.Runner.Stdout, "Applying the updated deployment plan…")
			if applyErr := r.Apply(); applyErr != nil {
				_, _ = fmt.Fprintf(r.Runner.Stderr, "reconcile failed: %v\n", applyErr)
				nextRetry = r.Now().Add(retry)
			} else {
				applied = current
				nextRetry = time.Time{}
			}
		case !nextRetry.IsZero() && r.Now().After(nextRetry):
			if applyErr := r.Apply(); applyErr != nil {
				_, _ = fmt.Fprintf(r.Runner.Stderr, "reconcile failed: %v\n", applyErr)
				nextRetry = r.Now().Add(retry)
			} else {
				applied = current
				nextRetry = time.Time{}
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(interval):
		}
	}
}

func fingerprint(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:]), nil
}
