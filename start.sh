#!/bin/sh                                                                                                                                                                                                                                                                            

rm ~/log/dattss.fvr
forever start -a -l ~/log/dattss.fvr app.js
