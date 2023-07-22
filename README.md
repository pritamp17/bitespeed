# bitespeed

**PROJECT SETUP**

* clone this repo
* cd to project dir
* run `docker-compose build`
* then `docker-compose up`
* make `POST `request to ` http://localhost:3016/contacts/identify`
* request format

  ```json
  {
  	"email": "mcfly@hillvalley.edu",
  	"phoneNumber": "123456"
  }
  ```
* getAllUsers -> `GET http://localhost:3016/contacts/getall`
