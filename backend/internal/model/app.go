package model

type Project struct {
	ID                  int64  `json:"id,string" safe:"true" db:"id"`
	AudienceID          int64  `json:"audience_id,string" safe:"true" db:"audience_id"`
	SecurityStamp       int64  `json:"security_stamp,string" safe:"true" db:"security_stamp"`
	Name                string `json:"name" safe:"true" db:"name"`
	Description         string `json:"description" safe:"true" db:"description"`
	CreatedAt           int64  `json:"created_at,string" safe:"true" db:"created_at"`
	UpdatedAt           int64  `json:"updated_at,string" safe:"true" db:"updated_at"`
	EncryptedPrivateKey string `json:"-" db:"encrypted_private_key"`
	PublicKey           string `json:"public_key" safe:"true" db:"public_key"`
}

type App struct {
	ID           int64  `json:"id,string" safe:"true" db:"id"`
	ProjectID    int64  `json:"project_id,string" safe:"true" db:"project_id"`
	OwnerID      int64  `json:"owner_id,string" safe:"true" db:"owner_id"`
	Name         string `json:"name" safe:"true" db:"name"`
	Description  string `json:"description" safe:"true" db:"description"`
	CreatedAt    int64  `json:"created_at,string" safe:"true" db:"created_at"`
	UpdatedAt    int64  `json:"updated_at,string" safe:"true" db:"updated_at"`
	MailerAPIKey string `json:"-" db:"mailer_api_key"`
}

type AppMail struct {
	ID        int64  `json:"id,string" safe:"true" db:"id"`
	AppID     int64  `json:"app_id,string" safe:"true" db:"app_id"`
	Content   string `json:"content" safe:"true" db:"content"`
	Subject   string `json:"subject" safe:"true" db:"subject"`
	From      string `json:"from" safe:"true" db:"from"`
	CreatedAt int64  `json:"created_at,string" safe:"true" db:"created_at"`
	UpdatedAt int64  `json:"updated_at,string" safe:"true" db:"updated_at"`
}
