from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, ScopedRateThrottle

class BurstRateThrottle(UserRateThrottle):
    """Throttle for burst requests"""
    scope = 'burst'

class SustainedRateThrottle(UserRateThrottle):
    """Throttle for sustained requests"""
    scope = 'sustained'

class CriticalRateThrottle(UserRateThrottle):
    """Throttle for critical operations"""
    scope = 'critical'

class POSUserRateThrottle(UserRateThrottle):
    """Custom throttle for POS users based on role"""
    
    def get_rate(self):
        if self.request.user.is_authenticated:
            if self.request.user.role == 'admin':
                return '1000/min'
            elif self.request.user.role == 'cashier':
                return '100/min'
            else:
                return '50/min'
        return '20/min'