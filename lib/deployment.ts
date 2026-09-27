export function allowedOrigins(env:NodeJS.ProcessEnv=process.env){
  const origins=new Set<string>();
  if(env.APP_ORIGIN)origins.add(new URL(env.APP_ORIGIN).origin);
  if(env.VERCEL_URL)origins.add(`https://${env.VERCEL_URL}`);
  if(env.VERCEL_PROJECT_PRODUCTION_URL)origins.add(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if(env.NODE_ENV!=='production'){
    origins.add('http://localhost:3000');origins.add('http://127.0.0.1:3000');
  }
  return origins;
}
export function secureSessionCookie(env:NodeJS.ProcessEnv=process.env){return env.NODE_ENV==='production'||env.COOKIE_SECURE==='true';}
