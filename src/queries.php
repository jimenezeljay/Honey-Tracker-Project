<?php
//This file contains functions that query the database and return data in the format expected by the API.

function seasonLabel(string $date): string {
    $m = (int)substr($date, 5, 2);
    $s = match (true) {
        $m >= 3 && $m <= 5 => 'Spring',
        $m >= 6 && $m <= 8 => 'Summer',
        $m >= 9 && $m <= 11 => 'Fall',
        default => 'Winter',
    };
    return $s . ' ' . substr($date, 0, 4);
}

function batchFlags(int $hiveCount, ?string $form): array {
    $flags = [];
    if ($form === 'creamed') $flags[] = 'creamed';
    if ($hiveCount === 1)    $flags[] = 'single-hive';
    return $flags;
}

// 'certified' is only added for certified keepers, so suspended keepers never show it
function buildBadges(string $certification, array $codes, array $flags, string $verification): array {
    $badges = [];
    if ($certification === 'certified') $badges[] = 'certified';
    foreach (['raw', 'pure'] as $c) {          // assumed classification codes, see below
        if (in_array($c, $codes, true)) $badges[] = $c;
    }
    $badges = array_merge($badges, $flags);
    if ($verification === 'volunteer') $badges[] = 'volunteer-verified';
    return $badges;
}

function keeperObject(array $r): array {
    return [
        'id'                => (int)$r['keeper_id'],
        'displayName'       => $r['display_name'],
        'photo'             => $r['keeper_photo'],
        'bio'               => $r['bio'],
        'applicationStatus' => $r['application_status'],
        'certification'     => $r['certification'],
        'shipping' => [
            'ships'      => $r['ships'],
            'cost'       => $r['shipping_cost_cents'] === null ? null : $r['shipping_cost_cents'] / 100,
            'turnaround' => $r['shipping_turnaround'],
        ],
        'pickup'  => $r['offers_pickup'],
        'shopUrl' => $r['shop_url'],
    ];
}

function farmObject(array $r): array {
    [$lat, $lng] = farmCoords($r['coord_precision'], $r['lat'], $r['lng']);
    return [
        'id' => (int)$r['farm_id'], 'keeperId' => (int)$r['keeper_id'],
        'name' => $r['name'], 'description' => $r['description'], 'photo' => $r['photo_url'],
        'county' => $r['county'], 'state' => $r['state'],
        'lat' => $lat, 'lng' => $lng,
        'precision' => $r['coord_precision'], 'verification' => $r['verification'],
        'certified' => $r['certified'],
    ];
}

function hiveObject(array $h, array $farm): array {
    [$lat, $lng] = hiveCoords($farm['coord_precision'], $farm['lat'], $farm['lng']);
    return [
        'id' => (int)$h['hive_id'], 'farmId' => (int)$h['farm_id'], 'label' => $h['hive_code'],
        'lat' => $lat, 'lng' => $lng,
        'forageRadiusMi' => round($farm['forage_radius_m'] / 1609.344, 1),
        'beeType' => $h['bee_type'],
    ];
}

function listingCard(array $r): array {
    [$lat, $lng] = farmCoords($r['coord_precision'], $r['lat'], $r['lng']);
    $flags = batchFlags((int)$r['hive_count'], $r['honey_form']);
    return [
        'id' => (int)$r['product_id'], 'batchId' => (int)$r['batch_id'],
        'title' => $r['title'], 'photo' => $r['photo_url'],
        'price' => $r['price_cents'] / 100,
        'jarOz' => $r['jar_size_g'] === null ? null : (int)round($r['jar_size_g'] / 28.3495),
        'stock' => (int)$r['stock_qty'],
        'badges' => buildBadges($r['certification'], json_decode($r['class_codes'], true) ?? [],
                                $flags, $r['verification']),
        'farmId' => (int)$r['farm_id'], 'farmName' => $r['farm_name'], 'state' => $r['state'],
        'lat' => $lat, 'lng' => $lng,
        'honeyType' => $r['honey_type'], 'texture' => $r['honey_form'],
        'season' => seasonLabel($r['harvest_date']), 'harvestDate' => $r['harvest_date'],
        'flags' => $flags,
    ];
}

function fetchListingRows(PDO $pdo, string $extraWhere = '', array $params = []): array {
    $stmt = $pdo->prepare(
        "SELECT p.product_id, p.batch_id, p.name AS title, p.photo_url, p.price_cents,
                p.jar_size_g, p.stock_qty,
                b.honey_form, b.hive_count, b.harvest_date, b.honey_type, b.class_codes,
                f.farm_id, f.name AS farm_name, f.state, f.lat, f.lng,
                f.coord_precision, f.verification, k.certification
         FROM honey.products p
         JOIN honey.v_api_batches b ON b.batch_id = p.batch_id
         JOIN honey.v_api_farms f   ON f.farm_id = b.farm_id
         JOIN honey.v_api_keepers k ON k.keeper_id = f.keeper_id
         WHERE p.is_active AND k.application_status = 'approved' $extraWhere
         ORDER BY p.product_id"
    );
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getListings(PDO $pdo): array {
    return array_map('listingCard', fetchListingRows($pdo));
}

function fetchFarmRows(PDO $pdo, string $extraWhere = '', array $params = []): array {
    $stmt = $pdo->prepare(
        "SELECT f.farm_id, f.keeper_id, f.name, f.description, f.photo_url, f.county, f.state,
                f.lat, f.lng, f.coord_precision, f.verification, f.certified, f.forage_radius_m,
                k.display_name, k.photo_url AS keeper_photo, k.bio, k.application_status,
                k.certification, k.ships, k.shipping_cost_cents, k.shipping_turnaround,
                k.offers_pickup, k.shop_url
         FROM honey.v_api_farms f
         JOIN honey.v_api_keepers k ON k.keeper_id = f.keeper_id
         WHERE k.application_status = 'approved' $extraWhere
         ORDER BY f.farm_id"
    );
    $stmt->execute($params);
    return $stmt->fetchAll();
}

// Three queries total (farms, hives, listings), no matter how many farms
function assembleFarms(PDO $pdo, array $farmRows): array {
    if (!$farmRows) return [];
    $ids = pgIntArray(array_column($farmRows, 'farm_id'));

    $byId = [];
    foreach ($farmRows as $f) $byId[$f['farm_id']] = $f;

    $stmt = $pdo->prepare(
        'SELECT hv.hive_id, hv.apiary_id AS farm_id, hv.hive_code, bt.common_name AS bee_type
         FROM honey.hives hv
         LEFT JOIN honey.bee_types bt ON bt.bee_type_id = hv.bee_type_id
         WHERE hv.apiary_id = ANY(CAST(:ids AS int[]))
         ORDER BY hv.hive_id'
    );
    $stmt->execute([':ids' => $ids]);
    $hives = [];
    foreach ($stmt as $h) {
        $hives[$h['farm_id']][] = hiveObject($h, $byId[$h['farm_id']]);
    }

    $listings = [];
    $rows = fetchListingRows($pdo, 'AND f.farm_id = ANY(CAST(:ids AS int[]))', [':ids' => $ids]);
    foreach ($rows as $r) $listings[$r['farm_id']][] = listingCard($r);

    return array_map(fn($f) => farmObject($f) + [
        'keeper'   => keeperObject($f),
        'hives'    => $hives[$f['farm_id']] ?? [],
        'listings' => $listings[$f['farm_id']] ?? [],
    ], $farmRows);
}

function getFarms(PDO $pdo): array {
    return assembleFarms($pdo, fetchFarmRows($pdo));
}

function getFarm(PDO $pdo, int $id): ?array {
    $rows = fetchFarmRows($pdo, 'AND f.farm_id = :id', [':id' => $id]);
    return assembleFarms($pdo, $rows)[0] ?? null;
}