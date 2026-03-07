CREATE TABLE cases (
	id VARCHAR NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	case_number VARCHAR(100), 
	client_name VARCHAR(255), 
	court VARCHAR(255), 
	status VARCHAR(20), 
	description TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE calendar_events (
	id VARCHAR NOT NULL, 
	case_id VARCHAR, 
	title VARCHAR(255) NOT NULL, 
	event_type VARCHAR(20), 
	event_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	category VARCHAR(20), 
	meeting_link VARCHAR(500), 
	description TEXT, 
	location VARCHAR(255), 
	is_reminder_sent BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE SET NULL
);

CREATE TABLE contract_analyses (
	id VARCHAR NOT NULL, 
	case_id VARCHAR, 
	title VARCHAR(255), 
	original_text TEXT NOT NULL, 
	status VARCHAR(50), 
	clauses TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE SET NULL
);

CREATE TABLE documents (
	id VARCHAR NOT NULL, 
	case_id VARCHAR, 
	filename VARCHAR(255) NOT NULL, 
	original_filename VARCHAR(255) NOT NULL, 
	file_path VARCHAR(500) NOT NULL, 
	file_type VARCHAR(50), 
	file_size INTEGER, 
	uploaded_at TIMESTAMP WITHOUT TIME ZONE, 
	transcript TEXT, 
	summary TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);