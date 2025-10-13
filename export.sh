for col in $(mongosh --port 27018 g-connector --quiet --eval "db.getCollectionNames().join(' ')"); do
  mongoexport --db=g-connector --port 27018 --collection=$col --out="${col}.json"
done
