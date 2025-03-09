export const ROAD_TYPES = {
    STRAIGHT_HORIZONTAL: 'straight_h',
    STRAIGHT_VERTICAL: 'straight_v',
    INTERSECTION: 'intersection'
};

export class Road {
    constructor(type) {
        this.type = type;
        this.hasTrafficLight = type === ROAD_TYPES.INTERSECTION;
        this.trafficLightState = this.hasTrafficLight ? 'red' : null;
        this.connections = this.getConnections();
    }

    getConnections() {
        // Define which directions this road piece connects to
        switch (this.type) {
            case ROAD_TYPES.STRAIGHT_HORIZONTAL:
                return { west: true, east: true, north: false, south: false };
            case ROAD_TYPES.STRAIGHT_VERTICAL:
                return { west: false, east: false, north: true, south: true };
            case ROAD_TYPES.INTERSECTION:
                return { west: true, east: true, north: true, south: true };
            default:
                return { west: false, east: false, north: false, south: false };
        }
    }

    toggleTrafficLight() {
        if (!this.hasTrafficLight) return;
        
        // Toggle between red and green
        this.trafficLightState = this.trafficLightState === 'red' ? 'green' : 'red';
    }

    render(ctx, x, y, tileSize) {
        ctx.save();
        ctx.translate(x, y);

        // Draw road base
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(0, -tileSize / 4);
        ctx.lineTo(tileSize / 2, 0);
        ctx.lineTo(0, tileSize / 4);
        ctx.lineTo(-tileSize / 2, 0);
        ctx.closePath();
        ctx.fill();

        // Draw road markings based on type
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        switch (this.type) {
            case ROAD_TYPES.STRAIGHT_HORIZONTAL:
                this.drawStraightRoad(ctx, tileSize, true);
                break;
            case ROAD_TYPES.STRAIGHT_VERTICAL:
                this.drawStraightRoad(ctx, tileSize, false);
                break;
            case ROAD_TYPES.INTERSECTION:
                this.drawIntersection(ctx, tileSize);
                break;
        }

        // Draw traffic light if present
        if (this.hasTrafficLight) {
            this.drawTrafficLight(ctx, tileSize);
        }

        ctx.restore();
    }

    drawStraightRoad(ctx, tileSize, isHorizontal) {
        ctx.beginPath();
        if (isHorizontal) {
            ctx.moveTo(-tileSize / 2, 0);
            ctx.lineTo(tileSize / 2, 0);
        } else {
            ctx.moveTo(0, -tileSize / 4);
            ctx.lineTo(0, tileSize / 4);
        }
        ctx.stroke();
    }

    drawIntersection(ctx, tileSize) {
        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(-tileSize / 2, 0);
        ctx.lineTo(tileSize / 2, 0);
        ctx.stroke();

        // Draw vertical line
        ctx.beginPath();
        ctx.moveTo(0, -tileSize / 4);
        ctx.lineTo(0, tileSize / 4);
        ctx.stroke();
    }

    drawTrafficLight(ctx, tileSize) {
        const size = tileSize / 8;
        ctx.fillStyle = this.trafficLightState === 'red' ? '#FF0000' : '#00FF00';
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }
} 