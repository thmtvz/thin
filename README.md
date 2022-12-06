# Thin

This is a webserver loosely based on nginx and expressjs.

Every call to the server is treated as a resource, the main concept behind Thin. A resource is defined by the combination of a site name, its route and its verb. Once the server receives a call to a given resurce, it drops it to the associated handler, that may or may not call other given and autorized handlers. 
