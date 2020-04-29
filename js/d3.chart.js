/*
version:1.0.1
*/

(function($, undefined) {
    $.fn.extend({
        collapseTree:function(){
            var defult_config = {
                fontSize: '20px',
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
                    //如果是根据实时数据，自动响应的，则要同时变节点的折叠图标
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
                          return "#ccc"; 
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
           
            return this;

        }
    });
}(jQuery));