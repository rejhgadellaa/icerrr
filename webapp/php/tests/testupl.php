<?

$url = "http://www.rejh.nl/icerrr/api/?a=post&q=%7B%22post%22%3A%22log%22%7D&apikey=REJH_ICERRR_APIKEY-f58a47008f65009f_1488c9bc1c2_b718e&cache=".time();

$myvars = 'log_id=zzz_test&log_html=Null&log_text=Null';

$ch = curl_init( $url );
curl_setopt( $ch, CURLOPT_POST, 1);
curl_setopt( $ch, CURLOPT_POSTFIELDS, $myvars);
curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt( $ch, CURLOPT_HEADER, 0);
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec( $ch );

echo $response;


?>