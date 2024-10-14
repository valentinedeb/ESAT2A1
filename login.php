<?php

session_start();


$correct_username = "admin";
$correct_password = "password123";


if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    $username = $_POST['username'];
    $password = $_POST['password'];

    if ($username === $correct_username && $password === $correct_password) {
        $_SESSION['loggedin'] = true;
        $_SESSION['username'] = $username;

        header('Location: House.html');
        exit;
    } else {
        echo "Invalid username or password!";
    }
}
?>
