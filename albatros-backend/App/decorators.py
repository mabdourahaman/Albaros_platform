from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from models import User

def jwt_role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in allowed_roles:
                return jsonify({'msg': 'Accès non autorisé'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator