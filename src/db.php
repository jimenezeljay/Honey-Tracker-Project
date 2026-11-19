<?php
//This file contains the code to connect to the database using PDO.
$env = parse_ini_file(__DIR__ . '/../.env');

if ($env === false) {
    exit('Could not read .env file.');
}

$dsn = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s',
    $env['DB_HOST'], $env['DB_PORT'], $env['DB_NAME']
);

try {
    $pdo = new PDO($dsn, $env['DB_USER'], $env['DB_PASS'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    send(['error' => 'Server error'], 500);
    exit('Database connection failed.');
}