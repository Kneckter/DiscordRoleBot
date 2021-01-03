<?php
    include('config/config.php');
    include('config/donate_config.php');
    if ($noNativeLogin === false || $noDiscordLogin === false) {
        if (isset($_COOKIE["LoginCookie"])) {
            if (validateCookie($_COOKIE["LoginCookie"]) === false) {
                header("Location: .");
            }
        }
        if (!empty($_SESSION['user']->updatePwd) && $_SESSION['user']->updatePwd === 1) {
            header("Location: ./user");
            die();
        }
        if (empty($_SESSION['user']->id) && $forcedLogin === true) {
            header("Location: ./user");
        }
    }

    if (!empty($_GET['lang'])) {
        setcookie("LocaleCookie", $_GET['lang'], time() + 60 * 60 * 24 * 31);
        header("Location: .");
    }

    if (!empty($_COOKIE["LocaleCookie"])) {
        $locale = $_COOKIE["LocaleCookie"];
    }

    if ($blockIframe) {
        header('X-Frame-Options: DENY');
    }
?>
<!DOCTYPE html>
<html lang="<?= $locale ?>">
    <head>
        <meta charset="utf-8">
        <title><?= $title ?></title>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,minimal-ui">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black">
        <meta name="apple-mobile-web-app-title" content="PokeMap">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="theme-color" content="#3b3b3b">
        <?php
            if ($faviconPath != "") {
                echo '<link rel="shortcut icon" href="' . $faviconPath . '" type="image/x-icon">';
            }
            else {
                echo '<link rel="shortcut icon" href="static/appicons/favicon.ico" type="image/x-icon">';
            }
        ?>
        <link rel="apple-touch-icon" href="static/appicons/114x114.png" sizes="57x57">
        <link rel="apple-touch-icon" href="static/appicons/144x144.png" sizes="72x72">
        <link rel="apple-touch-icon" href="static/appicons/152x152.png" sizes="76x76">
        <link rel="apple-touch-icon" href="static/appicons/114x114.png" sizes="114x114">
        <link rel="apple-touch-icon" href="static/appicons/120x120.png" sizes="120x120">
        <link rel="apple-touch-icon" href="static/appicons/144x144.png" sizes="144x144">
        <link rel="apple-touch-icon" href="static/appicons/152x152.png" sizes="152x152">
        <link rel="apple-touch-icon" href="static/appicons/180x180.png" sizes="180x180">
        <?php
            if ($gAnalyticsId != "") {
                echo '<!-- Google Analytics -->
                    <script>
                        window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
                        ga("create", "' . $gAnalyticsId . '", "auto");
                        ga("send", "pageview");
                    </script>
                    <script async src="https://www.google-analytics.com/analytics.js"></script>
                    <!-- End Google Analytics -->';
            }
        ?> <?php
            if (! $noCookie) {
                echo '<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.css" />
                    <script src="//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.1.0/cookieconsent.min.js"></script>
                    <script>
                    window.addEventListener("load", function(){
                        window.cookieconsent.initialise({
                        "palette": {
                            "popup": {
                            "background": "#3b3b3b"
                            },
                            "button": {
                            "background": "#d6d6d6"
                            }
                },
                "content": {
                    "message": "' . i8ln('This website uses cookies to ensure you get the best experience on our website.') . '",
                    "dismiss": "' . i8ln('Allow') . '",
                    "link": "' . i8ln('Learn more') . '",
                    "href": "https://www.cookiesandyou.com/"
                }
                    })});
                </script>';
            }
        ?>
        <script>var token = '<?php echo (! empty($_SESSION['token'])) ? $_SESSION['token'] : ""; ?>';</script>
        <link rel="stylesheet" href="static/dist/css/app.min.css">
        <?php
            if (file_exists('static/css/custom.css')) {
                echo '<link rel="stylesheet" href="static/css/custom.css?' . time() . '">';
            }
        ?>
        <style>
            .container{
                width: 100%;
                max-width: 1000px;
                display: table;
                margin: 35px auto 0;
                overflow: scroll;
            }
            .wrapper {
                width: 100%;
                height: 35px;
            }
            td {
                padding: 25px;
                border: 3px solid #666;
            }
            html, body {
              overflow: auto;
            }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <header id="header">
                <a href="#nav" title="<?php echo i8ln('Options') ?>"></a>
                <h1><a href="/"><?= $headerTitle ?><img src="<?= $raidmapLogo ?>" height="35" width="auto" border="0" style="float: right; margin-left: 5px; margin-top: 10px;"></a></h1>
                <?php
                    if ($paypalUrl != "") {
                        echo '<a href="' . $paypalUrl . '" target="_blank" style="float:right;padding:0 5px;">
                             <i class="fab fa-paypal" title="' . i8ln('PayPal') . '" style="position:relative;vertical-align:middle;color:white;margin-left:10px;font-size:20px;"></i>
                             </a>';
                    }
                    if ($telegramUrl != "") {
                        echo '<a href="' . $telegramUrl . '" target="_blank" style="float:right;padding:0 5px;">
                             <i class="fab fa-telegram" title="' . i8ln('Telegram') . '" style="position:relative;vertical-align: middle;color:white;margin-left:10px;font-size:20px;"></i>
                             </a>';
                    }
                    if ($whatsAppUrl != "") {
                        echo '<a href="' . $whatsAppUrl . '" target="_blank" style="float:right;padding:0 5px;">
                             <i class="fab fa-whatsapp" title="' . i8ln('WhatsApp') . '" style="position:relative;vertical-align:middle;color:white;margin-left:10px;font-size:20px;"></i>
                             </a>';
                    }
                    if ($discordUrl != "") {
                        echo '<a href="' . $discordUrl . '" target="_blank" style="float:right;padding:0 5px;">
                             <i class="fab fa-discord" title="' . i8ln('Discord') . '" style="position:relative;vertical-align:middle;color:white;margin-left:10px;font-size:20px;"></i>
                             </a>';
                    }
                    if ($customUrl != "") {
                        echo '<a href="' . $customUrl . '" target="_blank" style="float:right;padding:0 5px;">
                             <i class="' . $customUrlFontIcon . '" style="position:relative;vertical-align:middle;color:white;margin-left:10px;font-size:20px;"></i>
                             </a>';
                    }
                ?>
                <?php
                    if ($noNativeLogin === false || $noDiscordLogin === false) {
                        if (!empty($_SESSION['user']->id)) {
                            if ($_SESSION['user']->expire_timestamp < time() && $manualAccessLevel === true) {
                                echo '<i class="fas fa-user-times" title="' . i8ln('User Expired') . '" style="color: red;font-size: 20px;position: relative;float: right;padding: 0 5px;top: 17px;"></i>';
                            }
                            else {
                                echo '<i class="fas fa-user-check" title="' . i8ln('User Logged in') . '" style="color: green;font-size: 20px;position: relative;float: right;padding: 0 5px;top: 17px;"></i>';
                            }
                        }
                        else {
                            echo "<a href='./user' style='float:right;padding:0 5px;' title='" . i8ln('Login') . "'><i class='fas fa-user' style='color:white;font-size:20px;vertical-align:middle;'></i></a>";
                        }
                    }
                ?>
            </header>
            <nav id="nav">
                <div id="nav-accordion"></div>
                <?php
                    if (($noNativeLogin === false || $noDiscordLogin === false) && !empty($_SESSION['user']->id)) {
                        ?> <div><center><button class="settings" onclick="document.location.href='logout.php'"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> <?php echo i8ln('Logout'); ?> </button></center></div> <?php
                    }
                ?>
                <?php
                    if (!$noLocaleSelection) {
                        ?> <div class="form-control switch-container" style="width:40%;left:32%;top:10px;position:relative;"><select name="language-switch" onchange="location = this.value;"><option selected="selected"><?php echo i8ln('select language'); ?></option><option value="?lang=en"><?php echo i8ln('English'); ?></option><option value="?lang=de"><?php echo i8ln('German'); ?></option><option value="?lang=fr"><?php echo i8ln('French'); ?></option><option value="?lang=it"><?php echo i8ln('Italian'); ?></option><option value="?lang=pl"><?php echo i8ln('Polish'); ?></option><option value="?lang=sp"><?php echo i8ln('Spanish'); ?></option><option value="?lang=sv"><?php echo i8ln('Swedish'); ?></option></select></div><br><br> <?php
                    }
                ?>
                <?php
                    if (($noNativeLogin === false || $noDiscordLogin === false) && !empty($_SESSION['user']->id)) {
                        if ($manualAccessLevel) {
                            $time = date("Y-m-d", $_SESSION['user']->expire_timestamp);
                            echo '<div><center><p>';
                            if ($_SESSION['user']->expire_timestamp > time()) {
                                echo "<span style='color: green;'>" . i8ln('Membership expires on') . " {$time}</span>";
                            }
                            else {
                                echo "<span style='color: red;'>" . i8ln('Membership expired on') . " {$time}</span>";
                            }
                            echo '</p></center></div>';
                        }
                        echo '<div><center><p>' . i8ln('Logged in as') . ': ' . $_SESSION['user']->user . '</p></center></div><br>';
                    }
                ?>
            </nav>
        </div>
        <?php
            if (! $noDiscordLogin) { ?>
                <div class="accessdenied-modal" style="display: none;">
                    <?php
                        if ($copyrightSafe === false) { ?>
                            <img src="static/images/accessdenied.png" alt="PikaSquad" width="250">
                        <?php }
                    ?>
                    <center><?php echo i8ln('Your access has been denied.'); ?></center>
                    <br>
                    <?php echo i8ln('You might not be a member of our Discord or you joined a server which is on our blacklist. Click') . ' <a href="' . $discordUrl . '">' . i8ln('here') . '</a> ' . i8ln('to join!'); ?>
                </div>
            <?php }
        ?>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/skel/3.0.1/skel.min.js"></script>
        <script src="static/dist/js/app.min.js">//this is needed for nav window </script>
        <!-- For PayPal Stuff -->
        <div class="container">
            <?php
                if ($noNativeLogin === false || $noDiscordLogin === false) {
                    if (!empty($_SESSION['user']->id)) {
                        echo '<div><center><p>' . i8ln('Logged in as') . ': ' . $_SESSION['user']->user . '<br>' . i8ln('User ID') . ': ' . $_SESSION['user']->id . '</p></center></div><br>';
                    }
                    else {
                        echo '<div><center><p><b><u>' . i8ln('You must log into discord to donate!') . '</u><br>';
                        echo '<a href="./user" target="_blank" title="Login">Login</a></b></p></center></div>';
                    }
            ?>
                    <script src="https://www.paypal.com/sdk/js?client-id=<?php echo $CLIENT_ID ?>&disable-funding=credit&currency=<?php echo $CURRENCY ?>" data-sdk-integration-source="button-factory"></script>
                    <?php 
                        if (!empty($_SESSION['user']->id)) {
                    ?>
                            <script>
                                function initPayPalButton(timestamp, userID, value, days, fullUsername, container) {
                                    var invoiceID = userID + '-' + timestamp;
                                    var username = fullUsername.split("#")[0];
                                    paypal.Buttons({
                                        style: {
                                            layout:  'vertical',
                                            color:   'gold',
                                            shape:   'pill',
                                            label:   'pay'
                                        },
                                        createOrder: function(data, actions) {
                                            // Set up the transaction
                                            return actions.order.create({
                                                purchase_units: [{
                                                    description: days+'-Day Donation',
                                                    invoice_id: invoiceID,
                                                    custom_id: username,
                                                    amount: {
                                                        currency_code: '<?php echo $CURRENCY ?>',
                                                        value: value,
                                                        breakdown: {
                                                            item_total: {
                                                                currency_code: '<?php echo $CURRENCY ?>',
                                                                value: value
                                                            }
                                                        }
                                                    },
                                                    items: [
                                                        {
                                                            name: 'Trainer',
                                                            description: days,
                                                            unit_amount: {
                                                                currency_code: '<?php echo $CURRENCY ?>',
                                                                value: value
                                                            },
                                                            quantity: '1',
                                                            category: 'DIGITAL_GOODS'
                                                        }
                                                    ]
                                                }],
                                                application_context :  {
                                                    shipping_preference: 'NO_SHIPPING'
                                                }
                                            });
                                        },
                                        onApprove: function(data, actions) {
                                            return actions.order.capture().then(function(details) {
                                                alert('Donation approved! Thank you, ' + details.payer.name.given_name + '.\nIt could take 10 minutes to receive map access.');
                                                location.href = '/';
                                            });
                                        },
                                        onError: function(err) {
                                            alert(err);
                                            console.log(err);
                                        }
                                    }).render(container);
                                }
                            </script>
                    <?php } ?>
                    <table>
                        <tr>
                            <td>
                                <p><center><h1><?php echo $BUT1_DAYS ?>-Day Donation</h1>
                                <img src="https://raw.githubusercontent.com/Kneckter/DiscordRoleBot/pay_sql/30.png" width="200"></center></p>
                                <p>Amount: $<?php echo $BUT1_VALUE ?>
                                <br>Days: <?php echo $BUT1_DAYS ?>
                                <br>Access: <?php echo $BUT1_ACCESS ?></p>
                                <?php 
                                    if (!empty($_SESSION['user']->id)) {
                                ?>
                                    <div id="paypal-button-container1"></div>
                                    <script>
                                        initPayPalButton(<?php echo time() ?>, '<?php echo $_SESSION['user']->id ?>', '<?php echo $BUT1_VALUE ?>', '<?php echo $BUT1_DAYS ?>', '<?php echo $_SESSION['user']->user ?>', '#paypal-button-container1');
                                    </script>
                                <?php } ?>
                            </td>
                            <td>
                                <p><center><h1><?php echo $BUT2_DAYS ?>-Day Donation</h1>
                                <img src="https://raw.githubusercontent.com/Kneckter/DiscordRoleBot/pay_sql/60.png" width="200"></center></p>
                                <p>Amount: $<?php echo $BUT2_VALUE ?>
                                <br>Days: <?php echo $BUT2_DAYS ?>
                                <br>Access: <?php echo $BUT2_ACCESS ?></p>
                                <?php 
                                    if (!empty($_SESSION['user']->id)) {
                                ?>
                                    <div id="paypal-button-container2"></div>
                                    <script>
                                        initPayPalButton(<?php echo time() ?>, '<?php echo $_SESSION['user']->id ?>', '<?php echo $BUT2_VALUE ?>', '<?php echo $BUT2_DAYS ?>', '<?php echo $_SESSION['user']->user ?>', '#paypal-button-container2');
                                    </script>
                                <?php } ?>
                            </td>
                            <td>
                                <p><center><h1><?php echo $BUT3_DAYS ?>-Day Donation</h1>
                                <img src="https://raw.githubusercontent.com/Kneckter/DiscordRoleBot/pay_sql/90.png" width="200"></center></p>
                                <p>Amount: $<?php echo $BUT3_VALUE ?>
                                <br>Days: <?php echo $BUT3_DAYS ?>
                                <br>Access: <?php echo $BUT3_ACCESS ?></p>
                                <?php 
                                    if (!empty($_SESSION['user']->id)) {
                                ?>
                                    <div id="paypal-button-container3"></div>
                                    <script>
                                        initPayPalButton(<?php echo time() ?>, '<?php echo $_SESSION['user']->id ?>', '<?php echo $BUT3_VALUE ?>', '<?php echo $BUT3_DAYS ?>', '<?php echo $_SESSION['user']->user ?>', '#paypal-button-container3');
                                    </script>
                                <?php } ?>
                            </td>
                        </tr>
                    </table>
            <?php } ?>
        </div>
    </body>
</html>