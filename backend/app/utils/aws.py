import logging
import os
import boto3
import json
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any
from decimal import Decimal

from app.core.config import settings

logger = logging.getLogger(__name__)

# Then in the _initialize_clients method, change the endpoint_url:
def _initialize_clients(self):
    """Initialize AWS clients"""
    try:
        # Check if running locally
        is_local = os.environ.get('ENVIRONMENT') == 'dev'
        endpoint_url = 'http://localstack:4566' if is_local else None
        
        # Create S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'test'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'test'),
            region_name=settings.AWS_REGION,
            endpoint_url=endpoint_url
        )
        
        # Create DynamoDB client
        self.dynamodb_client = boto3.resource(
            'dynamodb',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID', 'test'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY', 'test'),
            region_name=settings.AWS_REGION,
            endpoint_url=endpoint_url
        )
    except Exception as e:
        logger.warning(f"Could not initialize AWS clients: {str(e)}")
        self.s3_client = None
        self.dynamodb_client = None
        self.initialized = False
        return
    
class DecimalEncoder(json.JSONEncoder):
    """Helper class to handle Decimal values in JSON serialization"""
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

class AWSClient:
    """AWS client for interacting with AWS services"""
    
    def __init__(self):
        self.s3_client = None
        self.dynamodb_client = None
        self.initialized = False
        
        # Initialize clients
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize AWS clients"""
        try:
            # Create S3 client
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
                region_name=settings.AWS_REGION
            )
            
            # Create DynamoDB client
            self.dynamodb_client = boto3.resource(
                'dynamodb',
                aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
                region_name=settings.AWS_REGION
            )
            
            self.initialized = True
            logger.info("AWS clients initialized successfully")
        except Exception as e:
            logger.warning(f"Could not initialize AWS clients: {str(e)}")
    
    def upload_to_s3(self, file_path: str, object_key: str, bucket: Optional[str] = None) -> bool:
        """
        Upload a file to S3
        
        Args:
            file_path: Path to the file to upload
            object_key: S3 object key
            bucket: S3 bucket name (defaults to settings.S3_BUCKET)
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.s3_client:
            logger.warning("AWS S3 client not initialized")
            return False
        
        bucket_name = bucket or settings.S3_BUCKET
        
        try:
            self.s3_client.upload_file(file_path, bucket_name, object_key)
            logger.info(f"Successfully uploaded {file_path} to s3://{bucket_name}/{object_key}")
            return True
        except ClientError as e:
            logger.error(f"Error uploading to S3: {str(e)}")
            return False
    
    def save_result_to_dynamodb(self, session_id: str, result: Dict[str, Any], table_name: str = "financial-results") -> bool:
        """
        Save processing result to DynamoDB
        
        Args:
            session_id: Processing session ID
            result: Result to save
            table_name: DynamoDB table name
            
        Returns:
            bool: Success status
        """
        if not self.initialized or not self.dynamodb_client:
            logger.warning("AWS DynamoDB client not initialized")
            return False
        
        try:
            # Convert result to JSON string and then parse as Decimal for DynamoDB
            json_str = json.dumps(result, cls=DecimalEncoder)
            item = json.loads(json_str, parse_float=Decimal)
            
            # Add session ID and timestamp
            item['session_id'] = session_id
            item['timestamp'] = Decimal(str(result.get('date_generated', '')))
            
            # Get table reference
            table = self.dynamodb_client.Table(table_name)
            
            # Save to DynamoDB
            table.put_item(Item=item)
            
            logger.info(f"Successfully saved results for session {session_id} to DynamoDB")
            return True
        except Exception as e:
            logger.error(f"Error saving to DynamoDB: {str(e)}")
            return False
    
    def get_result_from_dynamodb(self, session_id: str, table_name: str = "financial-results") -> Optional[Dict[str, Any]]:
        """
        Retrieve processing result from DynamoDB
        
        Args:
            session_id: Processing session ID
            table_name: DynamoDB table name
            
        Returns:
            Optional[Dict[str, Any]]: Result if found, None otherwise
        """
        if not self.initialized or not self.dynamodb_client:
            logger.warning("AWS DynamoDB client not initialized")
            return None
        
        try:
            # Get table reference
            table = self.dynamodb_client.Table(table_name)
            
            # Get item from DynamoDB
            response = table.get_item(Key={'session_id': session_id})
            
            if 'Item' in response:
                return response['Item']
            else:
                logger.warning(f"No results found for session {session_id}")
                return None
        except Exception as e:
            logger.error(f"Error retrieving from DynamoDB: {str(e)}")
            return None


# Create a single instance for use throughout the application
aws_client = AWSClient()