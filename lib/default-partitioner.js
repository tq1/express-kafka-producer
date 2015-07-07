// based on
//  https://github.com/kafka-dev/kafka/blob/b1e2d544d4e81571bbfe59defa62d5f7a674c9e0/core/src/main/scala/kafka/producer/DefaultPartitioner.scala

module.exports = function() {

    var Partitioner = {
        partition: function(key, numberOfPartitions) {
        if (!numberOfPartitions) return 0;

        if (key) {
          return Math.abs(Partitioner.hashCode(key) % numberOfPartitions);
        }
        else {
          return Math.floor(Math.random() * numberOfPartitions);
        }
      },
      // http://stackoverflow.com/a/7616484/429521
      // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/#comment-38551
      hashCode: function(str) {
        var hash = 0,
        strlen = str.length,
        i,
        c;
        if (strlen === 0) {
          return hash;
        }
        for (i = 0; i < strlen; i++) {
          c = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + c;
          hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
      }
    }

    return Partitioner;
}
