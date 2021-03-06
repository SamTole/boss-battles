#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const { v4: uuidv4 } = require('uuid');

module.exports = function query(query) {
    return new Promise(function(resolve){
        amqp.connect('amqp://test:test@10.10.5.32/%2F', function func_connect(error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function func_create_channel(error1, channel) {
                if (error1) {
                    throw error1;
                }
                channel.assertQueue('', {
                    exclusive: true
                }, function func_assert_queue(error2, q) {
                    if (error2) {
                        throw error2;
                    }
                    let correlationId = uuidv4();

                    console.log(' [x] Sending query: %s', query);

                    channel.consume(q.queue, function func_consume(msg) {
                        if (msg.properties.correlationId == correlationId) {
                            const obj = JSON.parse(msg.content.toString());
                            //console.log(' [.] Got %s', msg.content.toString());
                            //console.log(' [.] JSON\n' + JSON.stringify(obj, null, 2));
                            setTimeout(function () {
                                connection.close();
                                //process.exit()
                            }, 500);
                            resolve(obj);
                        }
                    }, {
                        noAck: true
                    });

                    channel.sendToQueue('sqlQueue',
                        Buffer.from(query), {
                            correlationId: correlationId,
                            replyTo: q.queue
                        });
                });
            });
        });
    });
}