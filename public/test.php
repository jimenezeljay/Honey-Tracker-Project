<?php
require __DIR__ . '/../src/db.php';

$version = $pdo->query('SELECT version()')->fetchColumn();
echo 'Connected! ' . htmlspecialchars($version);