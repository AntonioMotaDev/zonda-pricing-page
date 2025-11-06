<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/../vendor/autoload.php';

use Google\Client;
use Google\Service\Calendar;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Cargar credenciales de la Service Account
$client = new Client();
$client->setAuthConfig(__DIR__ . '/credentials.json');
$client->addScope(Calendar::CALENDAR);
$service = new Calendar($client);

$data = json_decode(file_get_contents("php://input"), true);

// Si no vienen datos → devolver mensaje y terminar
if (!$data) {
    echo json_encode([
        "error" => true,
        "message" => "No event data received. Send JSON via POST."
    ]);
    exit;
}
// Calendar ID de Google
$calendarId = '3f2e52b055d693b7a33beb94909cd77b643959fc2b81191bd19cdc94975941d8@group.calendar.google.com';

// Crear evento con Google Meet
$event = new Calendar\Event([
    'summary' => $data['summary'] ?? '',
    'description' => $data['description'] ?? '',
    'start' => [
        'dateTime' => $data['start']['dateTime'],
        'timeZone' => $data['start']['timeZone'] ?? 'America/Mexico_City'
    ],
    'end' => [
        'dateTime' => $data['end']['dateTime'],
        'timeZone' => $data['end']['timeZone'] ?? 'America/Mexico_City'
    ],
    'conferenceData' => [
        'createRequest' => [
            'requestId' => uniqid(),
            'conferenceSolutionKey' => [
                'type' => 'hangoutsMeet'
            ]
        ]
    ]
]);

// Insertar evento
$result = $service->events->insert(
    $calendarId,
    $event,
    ['conferenceDataVersion' => 1]
);

// Responder al frontend
echo json_encode($result);
