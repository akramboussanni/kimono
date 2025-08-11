package repo

import (
	"github.com/akramboussanni/kimono/internal/model"
	"github.com/jmoiron/sqlx"
)

type ProjectRepo struct {
	AppColumns     Columns
	ProjectColumns Columns
	MailColumns    Columns
	db             *sqlx.DB
}

func NewProjectRepo(db *sqlx.DB) *ProjectRepo {
	repo := &ProjectRepo{db: db}
	repo.ProjectColumns = ExtractColumns[model.Project]()
	repo.AppColumns = ExtractColumns[model.App]()
	repo.MailColumns = ExtractColumns[model.AppMail]()
	return repo
}
