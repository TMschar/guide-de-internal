import os
import json
import boto3
from dynamodb_json import json_util

TABLE_NAME = os.environ['DYNAMO_DB_TABLE_NAME']

client = boto3.client(
    'dynamodb',
    aws_access_key_id=os.environ['APP_AWS_ACCESS_KEY_ID'],
    aws_secret_access_key=os.environ['APP_AWS_SECRET_ACCESS_KEY'],
    region_name='eu-north-1',
)


def get_all_locations(event, context):
    items = client.scan(
        TableName=TABLE_NAME,
    )

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
        },
        'body': json.dumps(json_util.loads(items)),
    }


def get_location(event, context):
    try:
        location_id = event['queryStringParameters']['location_id']
        if not location_id:
            return {
                'statusCode': 404,
                'body': json.dumps(context),
            }

        item = client.get_item(
            TableName=TABLE_NAME,
            Key={
                'location_id': {
                    'S': location_id,
                },
            },
        )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(json_util.loads(item)),
        }
    except KeyError:
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(context),
        }


def add_location(event, context):
    try:
        body_data = json.loads(event['body'])
        location_name = body_data['location_name']
        longitude = body_data['longitude']
        latitude = body_data['latitude']
        username = body_data['username']
        description = body_data['description']

        payload = {
            'location_id': location_name,
            'name': location_name,
            'username': username,
            'description': description,
            'pos': {
                'lng': longitude,
                'lat': latitude,
            },
            'reviews': [],
        }

        dynamo_payload = json.loads(json_util.dumps(payload))

        response = client.put_item(
            TableName='t5guide_locations',
            Item=dynamo_payload,
        )

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(response),
        }

    except KeyError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(context),
        }


def add_review(event, context):
    try:
        location_id = event['queryStringParameters']['location_id']
        if not location_id:
            return {
                'statusCode': 404,
                'body': json.dumps(context),
            }

        item = client.get_item(
            TableName=TABLE_NAME,
            Key={
                'location_id': {
                    'S': location_id,
                },
            },
        )

        location = json_util.loads(item)['Item']

        body_data = json.loads(event['body'])
        username = body_data['username']
        text = body_data['text']
        stars = body_data['stars']

        reviews = location['reviews']
        reviews.append({
            'username': username,
            'text': text,
            'stars': stars,
        })
        location['reviews'] = reviews

        dynamo_payload = json.loads(json_util.dumps(location))

        response = client.put_item(
            TableName=TABLE_NAME,
            Item=dynamo_payload,
        )

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(response),
        }

    except KeyError:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps(context),
        }
