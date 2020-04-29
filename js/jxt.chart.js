/*
version:1.0.1
*/

(function($, undefined) {
    var chartTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0.0);
    $.fn.extend({

        bar: function() {
            var defult_config = {
                minValue: 0,
                maxValue: 150,
                rectColor: "#000fff"
            };
            var top = 20,
                right = 20,
                bottom = 30,
                left = 40;

            this.init = function() {
                var element = $(this);
                var elementId = element.attr("xlink:href");
                this.barConfig = defult_config;
                this.svg = d3.select(elementId);
                //取出真实的top值
                var yAxisElement=this.svg.select(".y-axis");
                var transformAttrValue=yAxisElement.attr("transform");
                var topStr=transformAttrValue.split(",")[1];
                top=parseFloat(topStr.substr(0,topStr.length-1));

                var strs = this.svg.attr("viewBox").split(" ");
                this.width = strs[2] - left - right;
                this.height = strs[3] - top - bottom;
                this.min = element.attr("minvalue") == undefined ? this.barConfig.minValue : element.attr("minvalue");
                this.max = element.attr("maxvalue") == undefined ? this.barConfig.maxValue : element.attr("maxvalue");
                this.rectColor = this.svg.select(".bar-rect").attr("fill");
                this.yScale =
                    d3.scaleLinear()
                    .domain([this.min, this.max])
                    .range([0, this.height]);
                this.yScale.clamp(true);
                

            };

            this.update = function(updateData) {
               
                var _this = this;
                this.svg.selectAll(".bar-rect")
                    .data(updateData)
                    .transition()
                    .delay(function(d, i) {
                        return i / updateData.length * 1000;
                    })
                    .duration(200)
                    .ease(d3.easeLinear)
                    .attr("y", function(d) {

                        return _this.height - Math.max(_this.yScale(d), _this.yScale(0));

                    })
                    .attr("height", function(d) {
                        return Math.abs(_this.yScale(d) - _this.yScale(0));
                    })
                    .attr("fill", function(d) {

                        if (d > parseInt(_this.max)) {
                            return "#ff0000";
                        } else if (d < parseInt(_this.min)) {
                            return "#ff0000";
                        } else {
                            return _this.rectColor;
                        }
                    });

                var xScale = d3.scaleBand()
                    .domain(d3.range(updateData.length))
                    .range([0, this.width])
                    .paddingOuter([0.2])
                    .paddingInner([0.1]);

                this.svg.selectAll(".bar-name")
                    .data(updateData) //绑定数据
                    .transition()
                    .delay(function(d, i) {
                        return i / updateData.length * 1000;
                    })
                    .duration(200)
                    .ease(d3.easeLinear)
                    .attr("y", function(d) {
                        return _this.height - _this.yScale(d);
                    })
                    
                    .attr("dy", function(d) {
                        return "-0.2em"
                        
                    })
                    .text(function(d) {
                        return parseFloat(d).toFixed(3);
                    })
                   
            }
            return this;
        },
        pie: function() {
           
           
            var tag_text =0;
            var tag_line = 0;
            var text_move_ratio = 15;
           
            this.init = function() {
                var element = $(this);
                var elementId = element.attr("xlink:href");
                var percent=element.attr("radiuspercent");

                this.svg = d3.select(elementId);

                var strs = this.svg.attr("viewBox").split(" ");
                this.width = strs[2];
                this.height = strs[3];
                //取出真实的top值
                var circleElement=this.svg.select("circle");
                var transformAttrValue=circleElement.attr("transform");
                var topStr=transformAttrValue.split(",")[1];
                var midValue=parseFloat(topStr.substr(0,topStr.length-1));
                var top=midValue*2-parseFloat(this.height);
              
                this.height=this.height-top;

                this.radius = Math.min(this.width, this.height) / 2;
                var names=element.attr("diagram-xnames");
                var nameArray=names.split(":");
                this.currentDatasets=[];
                for(var i=0;i<nameArray.length;i++){
                   this.currentDatasets.push({name:nameArray[i],currentData:0})
                }

                var shouldPercent=percent==undefined?0.54:percent;

               
                this.outerRadius=this.radius*shouldPercent
                this.arc=d3.arc()
                    .outerRadius(this.radius*shouldPercent)
                    .innerRadius(0);
                this.pieDistance=20; 
                 this.outerLabelGroupData=new Array(nameArray.length);
                 this.lineCoordGroups=new Array(nameArray.length);


            }

             function rotate(x, y, xm, ym, a) {

                    a = a * Math.PI / 180; // convert to radians

                    var cos = Math.cos,
                        sin = Math.sin,
                    // subtract midpoints, so that midpoint is translated to origin and add it in the end again
                    xr = (x - xm) * cos(a) - (y - ym) * sin(a) + xm,
                    yr = (x - xm) * sin(a) + (y - ym) * cos(a) + ym;

                    return { x: xr, y: yr };
            }

            this.update = function(dataset) {
                var _this = this;

                var sum=0;
                for(var i=0;i<dataset.length;i++){
                    var dataValue=dataset[i];
                    _this.currentDatasets[i].currentData=dataValue;
                    sum=sum+parseFloat(dataValue);
                }
                
                //如果不设置起终止弧度，则默认时逆时针的
                var pie = d3.pie()
                    .sort(null)
                    .value(function(d) { return d.currentData; });

                var piedata = pie(_this.currentDatasets);
                

                _this.svg.selectAll("path")
                    .data(piedata)
                    .attr("d", function(d) {
                        return _this.arc(d);
                    });

                _this.svg.selectAll(".valuetext")
                    .data(piedata)
                    .attr("transform", function(d) {
                        return "translate(" + _this.arc.centroid(d) + ")";
                    })
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return ((d.data.currentData/sum)*100).toFixed(1)+"%";
                    });
               
                function setIdealLabelPosition(){
                    _this.svg.selectAll(".label-group-outer")
                        .each(function(d, i) {
                            
                            var labelGroupNode = this;
                            if (!labelGroupNode) {
                              return;
                            }
                            var labelGroupDims = labelGroupNode.getBBox();
                            
                            var startRadian=piedata[i].startAngle;
                            var endRadian=piedata[i].endAngle;
                            var midRadian=startRadian+(endRadian-startRadian)/2;
                            var angle = (midRadian * (180 / Math.PI));
                            
                            var originalX = 0;
                            var originalY = 0 - (_this.outerRadius + _this.pieDistance);
                            var newCoords = rotate(originalX, originalY, 0, 0, angle);

                            // if the label is on the left half of the pie, adjust the values
                            var hemisphere = "right"; // hemisphere
                            if (angle > 180) {
                                newCoords.x -= (labelGroupDims.width + 8);
                                hemisphere = "left";
                            } else {
                                newCoords.x += 8;
                            }

                            _this.outerLabelGroupData[i] = {
                                x: newCoords.x,
                                y: newCoords.y,
                                w: labelGroupDims.width,
                                h: labelGroupDims.height,
                                hs: hemisphere
                            };
                        });
                     
                }
                function setIdealLinePosition(){
                    for(var i=0;i<dataset.length;i++){
                        var startRadian=piedata[i].startAngle;
                        var endRadian=piedata[i].endAngle;
                        var midRadian=startRadian+(endRadian-startRadian)/2;
                        var angle = (midRadian * (180 / Math.PI));
                       
                        var originCoords = rotate(0, 0 - _this.outerRadius, 0, 0, angle);
                        var heightOffset = _this.outerLabelGroupData[i].h / 2; // TODO check
                        var labelXMargin = 6; // the x-distance of the label from the end of the line [TODO configurable]

                        var quarter = Math.floor(angle / 90);
                        var midPoint = 4;
                        var x2, y2, x3, y3;

                        // this resolves an issue when the
                        if (quarter === 2 && angle === 180) {
                            quarter = 1;
                        }
                         //解决value为0时，quarter为4的情况
                        if(quarter==4){
                            labelXMargin=-16;
                            heightOffset=-3;
                            quarter=1;
                        }

                        switch (quarter) {
                            case 0:
                                x2 = _this.outerLabelGroupData[i].x - labelXMargin - ((_this.outerLabelGroupData[i].x - labelXMargin - originCoords.x) / 2);
                                y2 = _this.outerLabelGroupData[i].y + ((originCoords.y - _this.outerLabelGroupData[i].y) / midPoint);
                                x3 = _this.outerLabelGroupData[i].x - labelXMargin;
                                y3 = _this.outerLabelGroupData[i].y - heightOffset;
                                break;
                            case 1:
                                x2 = originCoords.x + (_this.outerLabelGroupData[i].x - originCoords.x) / midPoint;
                                y2 = originCoords.y + (_this.outerLabelGroupData[i].y - originCoords.y) / midPoint;
                                x3 = _this.outerLabelGroupData[i].x - labelXMargin;
                                y3 = _this.outerLabelGroupData[i].y - heightOffset;
                                break;
                            case 2:
                                var startOfLabelX = _this.outerLabelGroupData[i].x + _this.outerLabelGroupData[i].w + labelXMargin;
                                x2 = originCoords.x - (originCoords.x - startOfLabelX) / midPoint;
                                y2 = originCoords.y + (_this.outerLabelGroupData[i].y - originCoords.y) / midPoint;
                                x3 = _this.outerLabelGroupData[i].x + _this.outerLabelGroupData[i].w + labelXMargin;
                                y3 = _this.outerLabelGroupData[i].y - heightOffset;
                                break;
                            case 3:
                                var startOfLabel = _this.outerLabelGroupData[i].x + _this.outerLabelGroupData[i].w + labelXMargin;
                                x2 = startOfLabel + ((originCoords.x - startOfLabel) / midPoint);
                                y2 = _this.outerLabelGroupData[i].y + (originCoords.y - _this.outerLabelGroupData[i].y) / midPoint;
                                x3 = _this.outerLabelGroupData[i].x + _this.outerLabelGroupData[i].w + labelXMargin;
                                y3 = _this.outerLabelGroupData[i].y - heightOffset;
                                break;
                        }

                      
                        _this.lineCoordGroups[i] = [
                            { x: originCoords.x, y: originCoords.y },
                            { x: x2, y: y2 },
                            { x: x3, y: y3 }
                        ];
                        
                    }
                    
                }
                function resolveOuterLabelCollisions() {
                   var size=dataset.length;
                  
                   checkConflict(0, "clockwise", size);
                   checkConflict(size-1, "anticlockwise", size);
                }
                function rectIntersect(r1, r2){
                    var returnVal = (
                    // r2.left > r1.right
                    (r2.x > (r1.x + r1.w)) ||

                    // r2.right < r1.left
                    ((r2.x + r2.w) < r1.x) ||

                    // r2.top < r1.bottom
                    ((r2.y + r2.h) < r1.y) ||

                    // r2.bottom > r1.top
                    (r2.y > (r1.y + r1.h))
                    );

                    return !returnVal;

                }
                function adjustLabelPos(nextIndex, lastCorrectlyPositionedLabel, info){
                   
                    var xDiff, yDiff, newXPos, newYPos;
                    newYPos = lastCorrectlyPositionedLabel.y + info.heightChange;
                    yDiff = info.center.y - newYPos;

                    if (Math.abs(info.lineLength) > Math.abs(yDiff)) {
                        xDiff = Math.sqrt((info.lineLength * info.lineLength) - (yDiff * yDiff));
                    } else {
                        xDiff = Math.sqrt((yDiff * yDiff) - (info.lineLength * info.lineLength));
                    }

                    if (lastCorrectlyPositionedLabel.hs === "right") {
                        newXPos = info.center.x + xDiff;
                    } else {
                        newXPos = info.center.x - xDiff - _this.outerLabelGroupData[nextIndex].w;
                    }

                    _this.outerLabelGroupData[nextIndex].x = newXPos;
                    _this.outerLabelGroupData[nextIndex].y = newYPos;
                }
                function checkConflict(currIndex, direction, size) {
                    var i, curr;

                    if (size <= 1) {
                        return;
                    }

                    var currIndexHemisphere = _this.outerLabelGroupData[currIndex].hs;
                    if (direction === "clockwise" && currIndexHemisphere !== "right") {
                        return;
                    }
                    if (direction === "anticlockwise" && currIndexHemisphere !== "left") {
                        return;
                    }
                  
                    var nextIndex = (direction === "clockwise") ? currIndex+1 : currIndex-1;
                    if(nextIndex>size-1 || nextIndex<0){
                       return;
                    }

                    // this is the current label group being looked at. We KNOW it's positioned properly (the first item
                    // is always correct)
                    var currLabelGroup = _this.outerLabelGroupData[currIndex];

                    // this one we don't know about. That's the one we're going to look at and move if necessary
                    var examinedLabelGroup = _this.outerLabelGroupData[nextIndex];

                    var info = {
                        labelHeights: _this.outerLabelGroupData[0].h,
                        center:{x:0,y:0},
                        lineLength: (_this.outerRadius + _this.pieDistance),
                        heightChange: _this.outerLabelGroupData[0].h + 2 // 1 = padding
                    };

                    // loop through *ALL* label groups examined so far to check for conflicts. This is because when they're
                    // very tightly fitted, a later label group may still appear high up on the page
                    if (direction === "clockwise") {
                        i = 0;
                        for (; i<=currIndex; i++) {
                            curr = _this.outerLabelGroupData[i];

                            // if there's a conflict with this label group, shift the label to be AFTER the last known
                            // one that's been properly placed
                            if (rectIntersect(curr, examinedLabelGroup)) {
                                adjustLabelPos(nextIndex, currLabelGroup, info);
                                break;
                            }
                        }
                    } else {
                        i = size - 1;
                        for (; i >= currIndex; i--) {
                            curr = _this.outerLabelGroupData[i];

                            // if there's a conflict with this label group, shift the label to be AFTER the last known
                            // one that's been properly placed
                            if (rectIntersect(curr, examinedLabelGroup)) {
                                adjustLabelPos(nextIndex, currLabelGroup, info);
                                break;
                            }
                        }
                    }
                    checkConflict(nextIndex, direction, size);
                }
                // 设置标签位置
                setIdealLabelPosition();
                resolveOuterLabelCollisions();
                _this.svg.selectAll(".label-group-outer")
                    .attr("transform", function(d, i) {
                        var x = _this.outerLabelGroupData[i].x;
                        var y = _this.outerLabelGroupData[i].y;
                        return "translate(" + x + "," + y + ")";
                    });
                setIdealLinePosition();
                var lineFunction = d3.line()
                    .curve(d3.curveBasis)
                    .x(function(d) { return d.x; })
                    .y(function(d) { return d.y; });
                var lineGroup = _this.svg.select(".lineGroups") ;
            
                lineGroup.selectAll("path")
                    .data(_this.lineCoordGroups)
                    .attr("d", lineFunction)
                    


              

               
               
            }
            return this;
        },
        gauge: function() {
            var defult_config = {
                cx: 54,
                cy: 54,
                range: 150,
                minValue: 0,
                maxValue: 150,
                transitionDuration: 0
            }

            this.init = function() {
                var element = $(this);
                var elementId = element.attr("xlink:href");
                this.gaugeConfig = defult_config;
                this.svg = d3.select(elementId);

                this.gaugeConfig.minValue = element.attr("minvalue") == undefined ? this.gaugeConfig.minValue : parseFloat(element.attr("minvalue"));
                this.gaugeConfig.maxValue = element.attr("maxvalue") == undefined ? this.gaugeConfig.maxValue : parseFloat(element.attr("maxvalue"));
                this.gaugeConfig.range = this.gaugeConfig.maxValue - this.gaugeConfig.minValue;
                //取出真实的top值
                var circleElement=this.svg.select("circle");
                var transformAttrValue=circleElement.attr("transform");
                var cxStr=transformAttrValue.split(",")[0];
                var cyStr=transformAttrValue.split(",")[1];
              
                this.cx=parseFloat(cxStr.substr(cxStr.indexOf("(")+1,cxStr.length));
                this.cy=parseFloat(cyStr.substr(0,cyStr.length-1));
               
             


            }
            this.update = function(currentValue) {
                var _this = this;
                var pointerContainer = _this.svg.select(".pointerContainer");
                pointerContainer.selectAll("text").text(Math.round(currentValue));
                var pointer = pointerContainer.selectAll("polygon");
                pointer.transition()
                    .duration(this.gaugeConfig.transitionDuration)
                    .attrTween("transform", function() {
                        var pointerValue = currentValue;

                        if (currentValue > _this.gaugeConfig.maxValue) pointerValue = _this.gaugeConfig.maxValue + 0.02 * _this.gaugeConfig.range;
                        else if (currentValue < _this.gaugeConfig.minValue) pointerValue = _this.gaugeConfig.minValue - 0.02 * _this.gaugeConfig.range;
                        var degre = pointerValue / _this.gaugeConfig.range * 270 - (_this.gaugeConfig.minValue / _this.gaugeConfig.range * 270 + 45);
                        var targetRotation = (degre - 90);
                        var currentRotation = _this._currentRotation || targetRotation;
                        _this._currentRotation = targetRotation;

                        return function(step) {
                            var rotation = currentRotation + (targetRotation - currentRotation) * step;
                            return "rotate(" + rotation + ","+_this.cx+","+_this.cy+")";
                        }
                    });
            }
            return this;
        },
        percent: function() {
            var defult_config = {
                minValue: 0, // The gauge minimum value.
                maxValue: 100, // The gauge maximum value.
                circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
                circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
                circleColor: "#178BCA", // The color of the outer circle.
                waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
                waveCount: 1, // The number of full waves per width of the wave circle.
                waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
                waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
                waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
                waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
                waveAnimate: true, // Controls if the wave scrolls or is static.
                waveColor: "#178BCA", // The color of the fill wave.
                waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
                textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
                textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
                valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
                displayPercent: true, // If true, a % symbol is displayed after the value.
                textColor: "#045681", // The color of the value text when the wave does not overlap it.
                waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
            }

            this.init = function() {
                var element = $(this);
                this.elementId = element.attr("xlink:href");
                this.config = defult_config;
                this.svg = d3.select(this.elementId);
            }

            this.update = function(everyValue,totalValue) {
                if(everyValue>totalValue){
                    everyValue=totalValue;
                }
                var currentValue=((everyValue/totalValue)*100).toFixed(1);
                var _this = this;
                var percentText = _this.config.displayPercent ? "%" : "";
                var fillPercent = currentValue / 100;
                var newFinalValue = parseFloat(currentValue).toFixed(2);
                var textRounderUpdater = function(value) {
                    return Math.round(value);
                }
                if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                    textRounderUpdater = function(value) {
                        return parseFloat(value).toFixed(1);
                    };
                }
                if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                    textRounderUpdater = function(value) {
                        return parseFloat(value).toFixed(2);
                    };
                }

                var textTween = function() {
                    var i = d3.interpolate(this.textContent, parseFloat(currentValue).toFixed(2));
                    return function(t) {
                        this.textContent = textRounderUpdater(i(t)) + percentText;
                    }
                }

                _this.svg.selectAll(".textColor").transition()
                    .duration(_this.config.waveRiseTime)
                    .tween("text", textTween);
                _this.svg.selectAll(".waveTextColor").transition()
                    .duration(_this.config.waveRiseTime)
                    .tween("text", textTween);

                _this.svg.selectAll(".waveTextColor")
                    .text(currentValue + percentText);
                _this.svg.selectAll(".textColor")
                    .text(currentValue + percentText);

                var fillCircleGroup = _this.svg.select("circle");
                var fillCircleRadius = fillCircleGroup.attr("r");
                var waveLength = fillCircleRadius * 2 / _this.config.waveCount;
                var waveClipCount = 1 + _this.config.waveCount;
                var waveClipWidth = waveLength * waveClipCount;

                var waveHeightScale = d3.scaleLinear()
                    .range([0, _this.config.waveHeight, 0])
                    .domain([0, 50, 100]);

                var waveAnimateScale = d3.scaleLinear()
                    .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
                    .domain([0, 1]);


                var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
                var waveRiseScale = d3.scaleLinear()
                    // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                    // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                    // circle at 100%.
                    .range([(10 + fillCircleRadius * 2 + waveHeight), (10 - waveHeight)])
                    .domain([0, 1]);
                var newHeight = waveRiseScale(fillPercent);
                var waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
                var waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);
                var newClipArea;
                if (_this.config.waveHeightScaling) {
                    newClipArea = d3.area()
                        .x(function(d) {
                            return waveScaleX(d.x);
                        })
                        .y0(function(d) {
                            return waveScaleY(Math.sin(Math.PI * 2 * _this.config.waveOffset * -1 + Math.PI * 2 * (1 - _this.config.waveCount) + d.y * 2 * Math.PI));
                        })
                        .y1(function(d) {
                            return (fillCircleRadius * 2 + waveHeight);
                        });
                } else {
                    newClipArea = clipArea;
                }

                var newWavePosition = _this.config.waveAnimate ? waveAnimateScale(1) : 0;
                var waveGroup = _this.svg.select(_this.elementId + "_clipWavefillgauge1");
                var wave = waveGroup.select("path");

                var data = [];
                for (var i = 0; i <= 40 * waveClipCount; i++) {
                    data.push({ x: i / (40 * waveClipCount), y: (i / (40)) });
                }

                function animateWave() {
                    wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
                    wave.transition()
                        .duration(_this.config.waveAnimateTime * (1 - wave.attr('T')))
                        .ease(d3.easeLinear)
                        .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
                        .attr('T', 1)
                        .on("end", function() {
                            wave.attr('T', 0);
                            animateWave(_this.config.waveAnimateTime);
                        });
                }

                wave.datum(data)
                    .transition()
                    .duration(0)
                    .transition()
                    .duration(_this.config.waveAnimate ? (_this.config.waveAnimateTime * (1 - wave.attr('T'))) : (_this.config.waveRiseTime))
                    .ease(d3.easeLinear)
                    .attr('d', newClipArea)
                    .attr('transform', 'translate(' + newWavePosition + ',0)')
                    .attr('T', '1')
                    .on("end", function() {
                        if (_this.config.waveAnimate) {
                            wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
                            animateWave(_this.config.waveAnimateTime);
                        }
                    });

                var waveGroupXPosition = 10 + fillCircleRadius * 2 - waveClipWidth;
                waveGroup.transition()
                    .duration(_this.config.waveRiseTime)
                    .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')');
            }
            return this;
        },
        line: function() {
            var defult_config = {
                minValue: 0,
                maxValue: 150,
                samprate: 5,
                dataCount: 20
            }
           

            var top = 25,
                right = 20,
                bottom = 50,
                left = 40;
            var timeFormat = d3.timeFormat("%H:%M:%S");
            this.init = function(samprate) {
                var element = $(this);
                
                var elementId = element.attr("xlink:href");
                this.config = defult_config;
                this.svg = d3.select(elementId);
                //取出真实的top值
                var yAxisElement=this.svg.select(".y-axis");
                var transformAttrValue=yAxisElement.attr("transform");
                var topStr=transformAttrValue.split(",")[1];
                top=parseFloat(topStr.substr(0,topStr.length-1));
                

                var strs = this.svg.attr("viewBox").split(" ");
                this.width = strs[2] - left - right;
                this.height = strs[3] - top - bottom;
                this.config.minValue = element.attr("minvalue") == undefined ? this.config.minValue : parseFloat(element.attr("minvalue"));
                this.config.maxValue = element.attr("maxvalue") == undefined ? this.config.maxValue :parseFloat(element.attr("maxvalue"));
                this.config.dataCount = element.attr("datacounts") == undefined ? this.config.dataCount : parseInt(element.attr("datacounts"));
                var diagramNamestr = element.attr("diagram-xnames");
                var nameArray = diagramNamestr.split(":");
                this.dataJsonArray = [];
                for (var i = 0; i < nameArray.length; i++) {
                    this.dataJsonArray[i] = { name: nameArray[i], currentDatas: [] };
                }
                this.dataCountIndex = 1;
                this.constantNormalValue = 0;
                this.timeStep = samprate == undefined ? this.config.samprate * 1000 : samprate * 1000;
                var fdataGroups = this.svg.selectAll('.datagroups');
                fdataGroups.selectAll("circle").attr("cx", -10).attr("cy", -10);
                this.color = this.svg.select(".domain").attr("stroke");
                this.axisTextColor=this.svg.select(".axistext").attr("fill");
               


                 fdataGroups.selectAll("circle").on("mouseover", function(d) {
                    
                         chartTooltip.html("时间:" + timeFormat(new Date(d.time)) + "<br />" +
                                "值:" + parseFloat(d.currentValue).toFixed(3))
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY + 20) + "px")
                            .style("opacity", 1.0);
                    })
                    .on("mouseout", function(d) {
                        chartTooltip.style("opacity", 0.0);
                    });
               
            }

            this.update = function(updateData) {
                var _this = this;
                for (var i = 0; i < updateData.length; i++) {
                    _this.dataJsonArray[i].currentDatas.push(updateData[i]);
                    if (_this.dataJsonArray[i].currentDatas.length > _this.config.dataCount) {
                        _this.dataJsonArray[i].currentDatas.shift();
                    }
                }
                var timenow, timenow = updateData[0].time;

                
                var yScale = d3.scaleLinear()
                    .domain([_this.config.minValue, _this.config.maxValue])
                    .range([0, _this.height]);

                var xScale = d3.scaleTime()
                    .domain([new Date(timenow - _this.config.dataCount * _this.timeStep), new Date(timenow + _this.timeStep)])
                    .range([0, _this.width]);

                var linePath = d3.line()
                    .x(function(d) {
                        return xScale(d.time);
                    })
                    .y(function(d) {
                        if (d.currentValue > _this.config.maxValue) {
                            return _this.height - yScale(_this.config.maxValue);
                        } else if (d.currentValue < _this.config.minValue) {
                            return _this.height - yScale(_this.config.minValue);
                        } else {
                            return _this.height - yScale(d.currentValue);
                        }
                    }).curve(d3.curveCatmullRom.alpha(0.5));

                _this.svg.selectAll(".path") //选择<svg>中所有的<path>
                    .data(_this.dataJsonArray)
                    .attr("d", function(d) {
                        var dValue = linePath(d.currentDatas);
                        return dValue; //返回直线生成器得到的路径
                    });

                var fdataGroups = _this.svg.selectAll('.datagroups')
                    .data(_this.dataJsonArray);
                fdataGroups.selectAll("circle")
                    .data(function(d) {
                        return d.currentDatas
                    })
                    .attr('cx', function(d) {
                        return xScale(d.time)
                    })
                    .attr('cy', function(d) {
                        if (d.currentValue > _this.config.maxValue) {
                            return _this.height - yScale(_this.config.maxValue);
                        } else if (d.currentValue < _this.config.minValue) {
                            return _this.height - yScale(_this.config.minValue);
                        } else {
                            return _this.height - yScale(d.currentValue);
                        }
                    })
                    
                    .attr("fill", function(d) {
                        if (d.currentValue > _this.config.maxValue || d.currentValue < _this.config.minValue) {
                            return "#ff0000";
                        } else {
                            return "#ffffff";
                        }
                    });
                   

                xAxis = d3.axisBottom()
                    .scale(xScale)
                    .ticks(5)
                    .tickFormat(d3.timeFormat("%H:%M:%S"));
                var axisElement = _this.svg.selectAll(".x-axis");

                axisElement.call(xAxis);
                //d3的默认填充为黑色的必须去掉才能看到坐标轴的文字
                _this.svg.selectAll(".domain")
                    .attr("fill", "none");
                //添加辅助线
                axisElement.selectAll(".tick").append("line")
                    .attr("y2",-_this.height)
                    .attr("stroke",_this.color);


                _this.svg.selectAll(".x-axis").selectAll("line")
                    .attr("stroke", _this.color);
                _this.svg.selectAll(".x-axis").selectAll("text")
                    .attr("fill", _this.axisTextColor);
            }
            return this;
        },
        collapseTree:function(){
            var defult_config = {
                fontSize: '20px',
                //数据值为0则取灰色，数值为1取红色
                colorArray:["#ccc","#ff0000"],
                nodeWidth:160,
                nodeHeight:36,
                //节点上下直接的距离
                heightStep:50,
                width:1000,
                height:1000,
                dataDepth:3,
                background:"#D8BFD8"
            };
            this.mergeConfig=function(source,refConfig){
                 $.each(refConfig,function(name,value) {
                    if(source[name]==undefined || source[name]==null){
                        source[name]=value;
                    }
                 })
                 return source;
            }
            this.init = function(preConfig) {
                var element = $(this);
                if(preConfig==undefined){
                    this.config=defult_config;
                }else{
                   
                    this.config=this.mergeConfig(preConfig,defult_config);
                }

                this.width=element.attr("width")==undefined?this.config.width:parseFloat(element.attr("width"));
                this.height=element.attr("height")==undefined?this.config.height:parseFloat(element.attr("height"));
                this.margin = ({top: 100, right: 100, bottom: 10, left: 100});
                this.diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
                this.dx=this.config.heightStep;
                this.dy = this.width /(this.config.dataDepth+1);
                this.tree = d3.tree().nodeSize([this.dx, this.dy]);
                this.svg = d3.select(element[0])
                      .attr("viewBox", [-this.margin.left, -this.margin.top, this.width, this.dx])
                      .style("font", this.config.fontSize+" sans-serif")
                      .style("background-color", this.config.background)


                //存放连接线的组元素     
                this.gLink = this.svg.append("g")
                      .attr("fill", "none")
                      .attr("stroke", "#555")
                      .attr("stroke-opacity", 0.4)
                      .attr("stroke-width", 1.5);
               //存放节点的组元素  
                this.gNode = this.svg.append("g")
                      .attr("cursor", "pointer")
                      .attr("pointer-events", "all");

            }
            this.updateRoot=function(source,mode){
              
                var _this=this;
                const duration = d3.event && d3.event.altKey ? 2500 : 250;

               //返回需要显示的所有节点的集合
                const nodes = _this.root.descendants().reverse();
                //返回需要显示节点之间的连接线
                const links = _this.root.links();
                // 生成树的布局
                _this.tree(_this.root);

                let left = _this.root;
                let right = _this.root;
                _this.root.eachBefore(node => {

                  if (node.x < left.x) left = node;
                  if (node.x > right.x) right = node;
                });

                const height = right.x - left.x + _this.margin.top + _this.margin.bottom;

                const transition = _this.svg.transition()
                    .duration(duration)
                    .attr("viewBox", [-_this.margin.left, left.x - _this.margin.top, _this.width, _this.height])
                    .tween("resize", window.ResizeObserver ? null : () => () => _this.svg.dispatch("toggle"));

                // 更新所有要显示的节点
                const node = _this.gNode.selectAll("g")
                  .data(nodes, d => d.id);
                if(mode=="expandAll"){
                    // 如果是展开模式，则所有的要节点图标都要变减号
                    node.select(".plus_line").attr("stroke-width",0);
                }else if(mode=="collapseAll"){
                   //如果是折叠模式，根节点变成加号
                    node.select(".plus_line").attr("stroke-width",function(d){
                        if(d.parent==null){
                             return 2;
                        }
                    });
                }else if(mode=="autoExpand"){
                    //如果是根据实时数据，自动响应的，则要同时变节点的折叠图标和填充矩形颜色
                    node.select(".plus_line").attr("stroke-width",function(d){
                        if(d._children!=undefined && d._children!=null){
                            if(d.children!=null){
                                //如果存在子节点，且子节点展开了，则+号的竖线不显示
                                 return 0;
                             }else{
                                //如果存在子节点，且子节点未展开，则+号的竖线显示
                                return 2;
                             }
                        }else{
                            //如果确实不存在子节点，则➕的竖线不显示
                            return 0;
                        }
                    });
                    node.select("rect").attr("fill",function(d){
                         if(d.depth==_this.config.dataDepth){
                            var dataValue=d.data.value;
                            if(dataValue==1){
                                return "#ff0000"
                            }else{
                                return _this.config.colorArray[dataValue];
                            }
                         }else{
                            if(d.isOff){
                                return "#ff0000";
                            }else{
                                return "#ccc"
                            }
                            
                         }
                    })
                     
                }
                
                 

                // Enter any new nodes at the parent's previous position.
                const nodeEnter = node.enter().append("g")
                    .attr("transform", d => `translate(${source.y0},${source.x0})`)
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0)
                    .on("click", function(d,i,nodes){
                      
                          var currentNode=d3.select(nodes[i]);
                          d.children = d.children ? null : d._children;
                          //如果含有真正的子节点，折叠符号需变化，➕号变减号，减号变加号
                          if(d._children!=null){
                            var strokeWidth=currentNode.select(".plus_line").attr("stroke-width");
                            currentNode.select(".plus_line").attr("stroke-width",parseInt(strokeWidth)==0?2:0);
                          }
                          _this.updateRoot(d);
                    });
                    //对于新加的节点，也是要根据数据配置颜色的
                  nodeEnter.append("rect")
                    .attr("y", "-1em")
                    .attr("x", -_this.config.nodeWidth/2)
                    .attr("width", _this.config.nodeWidth)
                    .attr("height", _this.config.nodeHeight)
                    .attr("stroke","#555")
                    .attr("fill",function(d){
                        var dataValue=d.data.value;
                        if(dataValue!=undefined){
                            return _this.config.colorArray[dataValue];
                        }else{
                            if(d.isOff){
                                return "#ff0000"; 
                            }else{
                                return "#ccc"; 
                            }
                           
                        }
                    })
             
                nodeEnter.append("circle")
                    .attr("r", d => d._children ? 10 : 0)
                    .attr("cx", _this.config.nodeWidth/2)
                    .attr("stroke","#555")
                    .attr("fill", d => d._children ? "#fff" : "none")
                    .attr("stroke-width",3);

                 //➕的竖线
                 nodeEnter.append("line")
                    .attr("class","plus_line")
                    .attr("x2", _this.config.nodeWidth/2)
                    .attr("x1", _this.config.nodeWidth/2)
                    .attr("y1",-5)
                    .attr("y2", 5)
                    .attr("stroke", "#000000")
                    .attr("stroke-width",function(d){
                        if(d._children==null){
                            //如果后面没有子节点了，则不显示该竖线
                            return 0;
                        }else{
                            //如果后面有子节点，但是无需显示，则现在应为加号，需添加竖线
                            if(d.children==null){
                                  return 2;
                            }else{
                                //如果后面有子节点，并且当前显示，则为减号
                                return 0;
                            }
                        }
                    });

                //➕的横线
                 nodeEnter.append("line")
                    .attr("x2", _this.config.nodeWidth/2-5)
                    .attr("x1", _this.config.nodeWidth/2+5)
                    .attr("stroke", "#000000")
                    .attr("stroke-width",d => d._children ? 2: 0);

               
                   
                nodeEnter.append("text")
                    .attr("dy", "0.31em")
                    .attr("text-anchor", "middle")
                    .text(d => d.data.name)
                    .attr("stroke", "#000000");
                   

                // Transition nodes to their new position.
                const nodeUpdate = node.merge(nodeEnter).transition(transition)
                    .attr("transform", d => `translate(${d.y},${d.x})`)
                    .attr("fill-opacity", 1)
                    .attr("stroke-opacity", 1);

                // Transition exiting nodes to the parent's new position.
                const nodeExit = node.exit().transition(transition).remove()
                    .attr("transform", d => `translate(${source.y},${source.x})`)
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0);

                // Update the links…
                const link = _this.gLink.selectAll("path")
                  .data(links, d => d.target.id);

                // Enter any new links at the parent's previous position.
                const linkEnter = link.enter().append("path")
                    .attr("d", d => {
                      const o = {x: source.x0, y: source.y0};
                      return _this.diagonal({source: o, target: o});
                    });

                 
                // Transition links to their new position.
                link.merge(linkEnter).transition(transition)
                    .attr("d", function(d){
                        const target={x:d.target.x,y:d.target.y};
                        return _this.diagonal({source:d.source, target:target});
                    });

                // Transition exiting nodes to the parent's new position.
                link.exit().transition(transition).remove()
                    .attr("d", d => {
                      const o = {x: source.x, y: source.y};
                      return _this.diagonal({source: o, target: o});
                    });

                // Stash the old positions for transition.
                _this.root.eachBefore(d => {
                  d.x0 = d.x;
                  d.y0 = d.y;
                });
                
            }
            //初使加载json数据
            this.update=function(data){
                var _this = this;
                _this.treeData=data;
                _this.root = d3.hierarchy(data);
                _this.root.x0 = _this.dy / 2;
                _this.root.y0 = 0;
              
                _this.root.descendants().forEach((d, i) => {
                    d.id = i;
                    //为数据点的父节点设置flag，决定是否为红色
                    if(d.data.dataId!=undefined){
                         
                        var dataValue=d.data.value;
                        if(dataValue==1){
                            d.parent.isOff=true;
                            d.parent.parent.isOff=true;
                            d.parent.parent.parent.isOff=true;
                        }
                    }


                    d._children = d.children;
                    if (d.depth) d.children = null;
                });
                _this.updateRoot(_this.root);
               
            }
            this.expandAll=function(){
                var _this=this;
                _this.root = d3.hierarchy(_this.treeData);
                _this.root.x0 = _this.dy / 2;
                _this.root.y0 = 0;
                _this.root.descendants().forEach((d, i) => {
                    d.id = i;
                     if(d.data.dataId!=undefined){
                         
                        var dataValue=d.data.value;
                        if(dataValue==1){
                            d.parent.isOff=true;
                            d.parent.parent.isOff=true;
                            d.parent.parent.parent.isOff=true;
                        }
                    }
                    d._children = d.children;
                });
                _this.updateRoot(_this.root,"expandAll");
            }
            this.collapseAll=function(){
                var _this=this;
                _this.root = d3.hierarchy(_this.treeData);
                _this.root.x0 = _this.dy / 2;
                _this.root.y0 = 0;
                _this.root.descendants().forEach((d, i) => {
                   
                    d.id = i; 
                     if(d.data.dataId!=undefined){
                       
                        var dataValue=d.data.value;
                        if(dataValue==1){
                            d.parent.isOff=true;
                            d.parent.parent.isOff=true;
                            d.parent.parent.parent.isOff=true;
                        }
                    }
                    d._children = d.children;
                    d.children = null;
                });
                _this.updateRoot(_this.root,"collapseAll");
            }
            this.checkIsExpand=function(d){
                if(d._children!=null && d._children!=undefined){
                    if(d.children!=null && d.children!=undefined){
                        return true;
                    }else{
                        return false;
                    }

                }else{
                    return true;
                }
            }

            this.modifyCurrentRoot=function(showNameArray){
                var _this=this;
                  //遍历当前的所有节点。
                _this.root.descendants().forEach((d, i) => {
                    if(d.depth==0){
                       var isExpand=_this.checkIsExpand(d);
                       if(!isExpand){
                            //必然要展开
                            d.children=d._children;
                        }
                    }else if(d.depth==1){
                       var isExpand=_this.checkIsExpand(d);
                       if(!isExpand){
                        //如果没有展开，判断是否要展开
                         var currentVolName=d.data.name;
                         if(showNameArray.indexOf(currentVolName)!=-1){
                            //如果需要展开
                            d.children=d._children;
                          
                         }
                       }
                       
                    }else if(d.depth==2){
                       var isExpand=_this.checkIsExpand(d);
                       if(!isExpand){
                        //如果没有展开，判断是否要展开
                         var currentBayName=d.parent.data.name+"_"+d.data.name;
                         if(showNameArray.indexOf(currentBayName)!=-1){
                            //如果需要展开
                            d.children=d._children;
                            
                         }
                       }
                    }
                });
                _this.updateRoot(_this.root,"autoExpand");

            }
            //在遍历叶子节点的同时，将所有的非叶子节点的off都设置isOff=false
            this.getAllLeaf=function (data) {
                  let result = []
                  function getLeaf (data) {
                    
                    data.forEach(item => {
                      if (!item._children) {
                        result.push(item)
                      } else {
                        item.isOff=false;
                        getLeaf(item._children)
                      }
                    })
                  }
                  getLeaf(data)
                  return result;
            }
            this.updateRealData=function(realData){
                var _this=this;
                var shouldExpandNameArray=new Array();
                var dataNodeArray=new Array();
                $.each(realData,function(name,value) {
                    var dataValue=value;
                    
                    if(dataValue==1){
                        dataNodeArray.push(name);
                    }
                   
                 });
             
                
                var wholeData=d3.hierarchy(_this.treeData);
                wholeData.descendants().forEach((d, i) => {
                   
                   
                    if(d.depth==_this.config.dataDepth){
                        var dataId=d.data.dataId;
                        if(dataNodeArray.indexOf(dataId)!=-1){
                            var bayName=d.parent.data.name;
                            var volName=d.parent.parent.data.name;
                            
                            //如果需要展开,则需展开数据对应的间隔节点，电压等级节点
                            if(shouldExpandNameArray.indexOf(volName)==-1){
                                 shouldExpandNameArray.push(volName);
                            }
                            if(shouldExpandNameArray.indexOf(volName+"_"+bayName)==-1){
                                 shouldExpandNameArray.push(volName+"_"+bayName);
                            }
                        }
                    }
                 });
                //遍历所有的叶子节点，并修改其value,修改value的同时还要修改父节点的isOff属性
                 var allLeaf=_this.getAllLeaf(_this.root._children);
                
                 for(var i=0;i<allLeaf.length;i++){
                    var leafNode=allLeaf[i];
                    if(leafNode.depth==_this.config.dataDepth){
                        var dataId=leafNode.data.dataId;
                        if(realData[dataId]!=undefined){
                            leafNode.data.value=realData[dataId];
                            if(leafNode.data.value==1){
                                leafNode.parent.isOff=true;
                                leafNode.parent.parent.isOff=true;
                                leafNode.parent.parent.parent.isOff=true;

                            }

                        }
                        
                    }
                 }
                _this.updateRoot(_this.root,"autoExpand");
                
                //如果要展开指定的数据点，需要一层一层的展开，循环执行，因为后面的节点展开要基于前面的节点
                for(var i=0;i<3;i++){
                    _this.modifyCurrentRoot(shouldExpandNameArray);
                }

            }
            return this;

        }
    });
}(jQuery));