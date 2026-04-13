const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const signup = await fetch('http://localhost:3000/api/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name:'Test User', email:'testuser@example.com', password:'Password1'})
    });
    console.log('signup', signup.status, await signup.text());

    const login = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email:'testuser@example.com', password:'Password1'})
    });
    console.log('login', login.status, login.headers.get('set-cookie'));
    console.log(await login.text());
  } catch (err) {
    console.error(err);
  }
})();
