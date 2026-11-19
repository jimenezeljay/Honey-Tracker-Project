<?php
//This file contains helper functions that are used when getting data from the database.

function send($data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Privacy rule: used for farm objects AND the lat/lng on listing cards
function farmCoords(string $precision, $lat, $lng): array {
    if ($precision === 'approximate') {
        return [round((float)$lat, 2), round((float)$lng, 2)];
    }
    return [(float)$lat, (float)$lng];
}

// Privacy rule for hives: no real coordinates for approximate farms
function hiveCoords(string $precision, $lat, $lng): array {
    return $precision === 'approximate' ? [null, null] : [(float)$lat, (float)$lng];
}

// Convert an array of integers to a PostgreSQL integer array literal
function pgIntArray(array $ids): string {
    return '{' . implode(',', array_map('intval', $ids)) . '}';
}