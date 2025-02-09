CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE admins (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);


CREATE TABLE news (
    id UUID PRIMARY KEY,
    title_uz VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    title_eng VARCHAR(255) NOT NULL,
    title_qq VARCHAR(255) NOT NULL,
    body_uz TEXT NOT NULL,
    body_ru TEXT NOT NULL,
    body_eng TEXT NOT NULL,
    body_qq TEXT NOT NULL,
    date VARCHAR(255) NOT NULL
);

CREATE TABLE images (
    id UUID PRIMARY KEY,
    news_id UUID REFERENCES news(id) ON DELETE CASCADE,
    path VARCHAR(255) NOT NULL
);

CREATE TABLE directionstype (
    id UUID PRIMARY KEY,
    title_uz VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    title_eng VARCHAR(255) NOT NULL,
    title_qq VARCHAR(255) NOT NULL
);

CREATE TABLE directions (
    id UUID PRIMARY KEY,
    direction_name_uz VARCHAR(255) NOT NULL,
    direction_name_ru VARCHAR(255) NOT NULL,
    direction_name_eng VARCHAR(255) NOT NULL,
    direction_name_qq VARCHAR(255) NOT NULL,
    directiontype_id UUID REFERENCES directionstype(id) ON DELETE CASCADE,
    term INT NOT NULL
);
CREATE TABLE departments (
    id UUID PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    reseption VARCHAR(255) NOT NULL,
    lunch VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    about_uz TEXT NOT NULL,
    about_eng TEXT NOT NULL,
    about_ru TEXT NOT NULL,
    about_qq TEXT NOT NULL,
    goal_uz TEXT NOT NULL,
    goal_ru TEXT NOT NULL,
    goal_eng TEXT NOT NULL,
    goal_qq TEXT NOT NULL,
    image_path VARCHAR(255) NOT NULL
);

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    autolocation VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    middlename VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    previous_educational_institution VARCHAR(255) NOT NULL,
    pasport_front_path VARCHAR(255) NOT NULL,
    pasport_back_path VARCHAR(255) NOT NULL,
    diplom_path VARCHAR(255) NOT NULL,
    viloyat VARCHAR(255) NOT NULL,
    tuman VARCHAR(255) NOT NULL,
    mahalla VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    directionstype_id UUID REFERENCES directionstype(id) ON DELETE CASCADE,
    directions_id UUID REFERENCES directions(id) ON DELETE CASCADE
);
CREATE TABLE request_logs (
    id UUID PRIMARY KEY,
    ip_address VARCHAR(255) NOT NULL,
    route VARCHAR(255) NOT NULL,
    device VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

ALTER TABLE departments ALTER COLUMN role_uz DROP DEFAULT;
ALTER TABLE departments ALTER COLUMN role_ru DROP DEFAULT;
ALTER TABLE departments ALTER COLUMN role_eng DROP DEFAULT;
ALTER TABLE departments ALTER COLUMN role_qq DROP DEFAULT;

CREATE TABLE home (
    id UUID PRIMARY KEY,
    title_uz VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    title_eng VARCHAR(255) NOT NULL,
    title_qq VARCHAR(255) NOT NULL,
    description_uz VARCHAR(150) NOT NULL,
    description_ru VARCHAR(150) NOT NULL,
    description_eng VARCHAR(150) NOT NULL,
    description_qq VARCHAR(150) NOT NULL
);

CREATE TABLE applyisopen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status BOOLEAN DEFAULT TRUE
);

INSERT INTO applyisopen (status) VALUES (true);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message VARCHAR(250) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(255) NOT NULL,
    device VARCHAR(255) NOT NULL,
    latitude VARCHAR(255),
    longitude VARCHAR(255)
);