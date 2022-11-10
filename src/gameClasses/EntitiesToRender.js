var EntitiesToRender = /** @class */ (function () {
    function EntitiesToRender() {
        this.trackEntityById = {};
        ige.client.on('tick', this.frameTick, this);
    }
    EntitiesToRender.prototype.updateAllEntities = function ( /*timeStamp*/) {
        var currentTime = Date.now();
        if (!ige.lastTickTime)
            ige.lastTickTime = currentTime;
        for (var entityId in this.trackEntityById) {
            var entity = ige.$(entityId);
            if (entity) {
                // handle entity behaviour and transformation offsets
                if (ige.gameLoopTickHasExecuted) {
                    if (entity._deathTime !== undefined && entity._deathTime <= ige._tickStart) {
                        // Check if the deathCallBack was set
                        if (entity._deathCallBack) {
                            entity._deathCallBack.apply(entity);
                            delete entity._deathCallBack;
                        }
                        entity.destroy();
                    }
                    if (entity._behaviour && !entity.isHidden()) {
                        entity._behaviour();
                    }
                    // handle streamUpdateData
                    if (ige.client.myPlayer) {
                        var updateQueue = ige.client.entityUpdateQueue[entityId];
                        var processedUpdates = [];
                        while (updateQueue && updateQueue.length > 0) {
                            var nextUpdate = updateQueue[0];
                            if (
                            // Don't run if we're updating item's state/owner unit, but its owner doesn't exist yet
                            entity._category == 'item' &&
                                ( // updating item's owner unit, but the owner hasn't been created yet
                                (nextUpdate.ownerUnitId && ige.$(nextUpdate.ownerUnitId) == undefined) ||
                                    ( // changing item's state to selected/unselected, but owner doesn't exist yet
                                    (nextUpdate.stateId == 'selected' || nextUpdate.stateId == 'unselected') &&
                                        entity.getOwnerUnit() == undefined))) {
                                break;
                            }
                            else {
                                processedUpdates.push(ige.client.entityUpdateQueue[entityId].shift());
                            }
                        }
                        if (processedUpdates.length > 0) {
                            entity.streamUpdateData(processedUpdates);
                            // processedUpdates.forEach((value) => {
                            // 	console.log(value);
                            // });
                        }
                    }
                }
                // update transformation using incoming network stream
                if (ige.network.stream) {
                    entity._processTransform();
                }
                if (entity._translate && !entity.isHidden()) {
                    var x = entity._translate.x;
                    var y = entity._translate.y;
                    var rotate = entity._rotate.z;
                    if (entity._category == 'item') {
                        var ownerUnit = entity.getOwnerUnit();
                        if (ownerUnit) {
                            // if ownerUnit's transformation hasn't been processed yet, then it'll cause item to drag behind. so we're running it now
                            ownerUnit._processTransform();
                            // immediately rotate items for my own unit
                            if (ownerUnit == ige.client.selectedUnit) {
                                if (entity._stats.currentBody && entity._stats.currentBody.jointType == 'weldJoint') {
                                    rotate = ownerUnit._rotate.z;
                                }
                                else if (ownerUnit == ige.client.selectedUnit) {
                                    rotate = ownerUnit.angleToTarget; // angleToTarget is updated at 60fps
                                }
                                entity._rotate.z = rotate; // update the item's rotation immediately for more accurate aiming (instead of 20fps)
                            }
                            entity.anchoredOffset = entity.getAnchoredOffset(rotate);
                            if (entity.anchoredOffset) {
                                x = ownerUnit._translate.x + entity.anchoredOffset.x;
                                y = ownerUnit._translate.y + entity.anchoredOffset.y;
                                rotate = entity.anchoredOffset.rotate;
                            }
                        }
                    }
                    if (entity.tween && entity.tween.isTweening) {
                        entity.tween.update();
                        x += entity.tween.offset.x;
                        y += entity.tween.offset.y;
                        rotate += entity.tween.offset.rotate;
                    }
                    entity.transformTexture(x, y, rotate);
                }
            }
        }
        ige.triggersQueued = [];
        ige.lastTickTime = currentTime;
        if (ige.gameLoopTickHasExecuted) {
            ige.gameLoopTickHasExecuted = false;
        }
    };
    EntitiesToRender.prototype.frameTick = function () {
        ige.engineStep();
        ige.input.processInputOnEveryFps();
        ige._renderFrames++;
        this.updateAllEntities();
    };
    return EntitiesToRender;
}());
//# sourceMappingURL=EntitiesToRender.js.map