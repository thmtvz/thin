# Thin

This is a webserver loosely based on nginx and expressjs.

Every call to the server is treated as a resource, the main concept behind Thin. A resource is defined by the combination of a site name, its route and its verb. Once the server receives a call to a given resurce, it drops it to the associated handler, that may or may not call other given and autorized handlers. 
A handler may be defined as a special module loaded on configuration time, that contains a plain javascript function, which receives access to the requst and response objects, other autorized modules, and the server global state facilities.
