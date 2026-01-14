const cors = require('cors');

const allowedOrigins= process.env.ALLOWED_ORIGINS.split(',');
const corsOptions = {
    origin: function(origin,callback){
        if(!origin)return callback(null,true);
        if(allowedOrigins.includes(origin)){
            return callback(null,true);
        }else{
            return callback(new Error('CORS POLICY: Origin not allowed'));
        }
    },
    methods:['GET','POST','PUT','DELETE'],
    credentials:true,
    allowedHeaders:['Content-Type','Authorization']
}
module.exports = cors(corsOptions);