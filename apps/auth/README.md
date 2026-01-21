# @true-impact/auth
We use [Supertokens] as our auth-server. See the top-level `docker-compose.yaml` to see how this is configured. 

## Getting Started
After spinning up a new instance of Supertokens, you need to add a first admin user to the Supertokens dashboard. You can do this as follows:
```sh
curl --location --request POST 'http://supertokens:3567/recipe/dashboard/user' \
--header 'rid: dashboard' \
--header 'api-key: <YOUR-API-KEY>' \
--header 'Content-Type: application/json' \
--data-raw '{"email": "<YOUR_EMAIL>","password": "<YOUR_PASSWORD>"}'
```