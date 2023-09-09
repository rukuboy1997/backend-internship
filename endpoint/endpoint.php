<?php

// Parse the GET parameters from the url

$slackName = isset($_GET['slack_name']) ? $_GET['slack_name'] : '';
$track = isset($_GET['track']) ? $_GET['track'] : '';

// Get the current day of the week and UTC time

$currentDay = date('l'); //Full day name
$utcTime = gmdate('Y-m-d\TH:i:s\Z');

// Construct a JSON response

$response = array(
    "slack_name" => $slackName,
    "current_day" => $currentDay,
    "utc_time" => $utcTime,
    "track" => $track,
    "github_file_url" => "https://github.com/drsaffas/backend-internship/blob/main/endpoint/endpoint.php",
    "github_repo_url" => "https://github.com/drsaffas/backend-internship.git",
    "status_code" => 200
);

// Convert the response array to JSON

$jsonResponse = json_encode($response);

// Set the Content-Type header to indicate JSON response

header('Content-Type: application/json');

// Return the JSON response

echo $jsonResponse;

?>