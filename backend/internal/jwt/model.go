package jwt

import (
	"time"

	"github.com/akramboussanni/kimono/config"
	"github.com/akramboussanni/kimono/internal/model"
)

type Jwt struct {
	Header  Header
	Payload Claims
}

func (j Jwt) WithType(t model.JwtType) Jwt {
	j.Payload.Type = t
	j.Payload.Expiration = time.Now().UTC().Unix() + config.App.JwtExpirations[string(t)]
	return j
}

type Header struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
}

type Claims struct {
	UserID     int64  `json:"sub"`
	TokenID    string `json:"jti"`
	AudienceID int64  `json:"aud"`

	SecurityStamp int64 `json:"usec"`
	ProjectStamp  int64 `json:"psec"`

	IssuedAt   int64         `json:"iat"`
	Expiration int64         `json:"exp"`
	Email      string        `json:"email"`
	Role       string        `json:"role"`
	Type       model.JwtType `json:"type"`
}
