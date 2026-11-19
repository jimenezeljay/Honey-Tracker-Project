<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

//This is the router for the API. It checks if the request path starts with /api/ and routes it to the api.php file. If not, it serves the static site as usual.

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/../src/api.php';
    return true;
}
return false; // serve the static site as usual