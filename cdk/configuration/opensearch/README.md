# OpenSearch Configuration

After creating the new OpenSearch domain, you'll need to manually configure it.

1. Create an admin user in your admin user pool.
2. Log in to your OpenSearch Dashboards using the admin user.
3. Create the `messages` index:
    1. Go to the Dev Tools view
    2. Enter `PUT messages`
    3. Copy the contents of `message-index.json` onto the next line
    4. Press the "Run" button
