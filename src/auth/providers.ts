export async function discord_oauth(code: string){
    // Request authorization token using authorization code
    let payload:any = {
        'client_id': ENV.DISCORD_ID,
        'client_secret': ENV.DISCORD_KEY,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'http://www.ifficient.tech/redirect'
    }
    let headers:any = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    fetch('https://discord.com/api/v8/oauth2/token', {
        method: "POST",
        body: JSON.stringify(payload),
        headers: headers
    }).then(data => data.json()).then(async (resp:any) => {
        logger.log(`Received token response: ${JSON.stringify(resp)}`)
        if(resp.hasOwnProperty('access_token')){
            headers = {
                'authorization': `${resp.token_type} ${resp.access_token}`
            }
            return fetch('https://discord.com/api/users/@me', {
                method: "GET",
                headers: headers
            }).then(data2 => data2.json()).then((subresp:any) => {
                logger.log(`Received identity response: ${JSON.stringify(subresp)}`);
                if(subresp.hasOwnProperty('username') && subresp.hasOwnProperty('discriminator') && subresp.hasOwnProperty('email')){
                    let username:string = `${subresp.username}#${subresp.discriminator}`
                    // upsertUser(username, '', subresp.email); TODO Fix upsertUser
                    return new JResponse(200, "success", {message: `User ${username} has been created`})
                }
                else
                    return new JResponse(403, "fail", {message: 'Discord identity request rejected'})
            }).catch(()=>{ return new JResponse(500, 'error', {message: 'Unable to contact Discord'}); });
        } else {
            return new JResponse(403, 'fail', {message: 'Discord OAuth code rejected'});
        }
    }).catch(()=> new JResponse(500, 'error', {message: 'Unable to contact Discord'}) );
}