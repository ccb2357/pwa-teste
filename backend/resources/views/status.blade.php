<!doctype html>
<html lang="{{ str_replace('_', '-', config('app.locale')) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Status — {{ config('app.name') }}</title>
</head>
<body>
    <main>
        <h1>Status da aplicação</h1>
        <p>Backend OK</p>
        @if ($result['checks']['database'] === 'ok')
            <p>Banco OK</p>
        @else
            <p role="alert">Banco indisponível. Tente novamente mais tarde.</p>
        @endif
        <p><a href="/status">Verificar novamente</a></p>
    </main>
</body>
</html>
