package backup

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
)

func jsonDecode(data []byte, value any) error { return json.Unmarshal(data, value) }

func completedSnapshot(data []byte) (string, error) {
	decoder := json.NewDecoder(bytes.NewReader(data))
	for {
		var message struct {
			Type string `json:"message_type"`
			ID   string `json:"snapshot_id"`
		}
		if err := decoder.Decode(&message); err != nil {
			if err == io.EOF {
				break
			}
			return "", fmt.Errorf("cannot read backup result: %w", err)
		}
		if message.Type == "summary" && snapshotID.MatchString(message.ID) {
			return message.ID, nil
		}
	}
	return "", fmt.Errorf("restic did not report a complete snapshot")
}
