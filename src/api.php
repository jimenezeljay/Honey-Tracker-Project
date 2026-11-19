<?php
//This is the main entry point for the API. It routes requests to the appropriate functions based on the request path and method.

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/queries.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send(['error' => 'Method not allowed'], 405);
}

$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

try {
    /*if ($path === 'api/listings') {
        send(getListings($pdo));
    }
    if (preg_match('#^api/listings/(\d+)$#', $path, $m)) {
        send(getListing($pdo, (int)$m[1]) ?? notFound());
    }
    if (preg_match('#^api/batches/(\d+)/trace$#', $path, $m)) {
        send(getTrace($pdo, (int)$m[1]) ?? notFound());
    }*/
    if ($path === 'api/farms') {
        send(getFarms($pdo));
    }
    if (preg_match('#^api/farms/(\d+)$#', $path, $m)) {
        send(getFarm($pdo, (int)$m[1]) ?? notFound());
    }
    notFound();
} catch (PDOException $e) {
    error_log($e->getMessage());
    send(['error' => 'Server error'], 500);
}

function notFound(): never {
    send(['error' => 'Not found'], 404);
}