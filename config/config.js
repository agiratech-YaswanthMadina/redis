module.exports = {
    development: {
        "PORT": 3000,
        "MONGO_MAX_TIME_MS": 60000,
        "NODE_ENV": "test",
        "MONGODB_URI": "mongodb://localhost:27017/boilerplate?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000",
        "MONGO_SOCKET_TIMEOUT": 60000,
        "MONGO_POOL_SIZE": 10,
        "ON_BEHALF_OF_HEADER": "x-intermx-user-email",
        "APIGEE_APIKEY": "xxxxxxxxxxxxxxx",
        "APIGEE_URL": "https://intermx-test.apigee.net/v1",
        "APIGEE_V2_USER_URL": "https://intermx-test.apigee.net/v2",
        "INTERMX_SERVICE_SHARED_SECRET": "abcd",
        "REDIS_HOST": "localhost",
        "REDIS_PORT": "6379",
        "REDIS_PWD": "68b4c654",
        "REDIS_SLAVES": "xxxxxxxxxxxxxxxxxxxxxxxx",
        "CIRCUIT_BREAKER_REDIS_ENABLE": true,
        "CIRCUIT_BREAKER_MONGO_ENABLE": false,
        "CIRCUIT_BREAKER_KAFKA_ENABLE": true,
        "CIRCUIT_BREAKER_APPLEVEL_ENABLE": true,
        "CIRCUIT_BREAKER_ENABLE": true,
        "KAFKA_HOST": "localhost:9092",
        "NO_OF_AVA_PODS": 1,
        "NO_OF_AVA_BROKER": 1
    }
}
    
