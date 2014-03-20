/*
 * Initial contribution/implementation by Andreas Stamoulias, Multimedia Content Lab (MCLab) (medialab.teicrete.gr),
 * Technological Institute of Crete - Department of Informatics Engineering.

 * Based on the RigidBodyPhysics component of the Extensible 3D (X3D)
 * http://www.web3d.org/files/specifications/19775-1/V3.2/Part01/components/rigid_physics.html

 * Specific optimizations and additions were based on Don Brutzman's (http://faculty.nps.edu/brutzman/brutzman.html) commentary 
 * and the X3D Rigid body physics examples (http://www.web3d.org/x3d/content/examples/Basic/RigidBodyPhysics/).

 * This software is based on x3dom framework and ammo.js under their licenses.

 * This software is dual licensed under the MIT and GPL licenses.

 * ==[MIT]====================================================================

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.


 * ==[GPL]====================================================================

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */


//	###################################################################
//	#################	REGISTER RIGID BODY NODES	###################
//	##########	Based on RigidBodyPhysics component of X3D	###########

//	### RigidBodyCollection ###
x3dom.registerNodeType("RigidBodyCollection", "X3DChildNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.RigidBodyCollection.superClass.call(this, ctx);
	this.addField_SFBool(ctx, 'autoDisable', false);
	this.addField_SFFloat(ctx, 'constantForceMix', 0.0001);
	this.addField_SFFloat(ctx, 'contactSurfaceThickness', 0);
	this.addField_SFFloat(ctx, 'disableAngularSpeed', 0);
	this.addField_SFFloat(ctx, 'disableLinearSpeed', 0);
	this.addField_SFFloat(ctx, 'disableTime', 0);
	this.addField_SFBool(ctx, 'enabled', true);
	this.addField_SFFloat(ctx, 'errorCorrection', 0.8);
	this.addField_SFVec3f(ctx, 'gravity', 0,-9.8,0);
	this.addField_SFInt32(ctx, 'iterations', 1);
	this.addField_SFFloat(ctx, 'maxCorrectionSpeed', -1);
	this.addField_SFBool(ctx, 'preferAccuracy', false);
	this.addField_MFNode('bodies', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('joints', x3dom.nodeTypes.X3DRigidJointNode);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		if(!this._cf.joints.nodes){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.X3DRigidJointNode)){
					this._cf.joints = this._xmlNode.children[x];
				}
			}
		}
		if(!this._cf.bodies.nodes){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.RigidBody)){
					this._cf.bodies = this._xmlNode.children[x];
				}
			}
		}
		x3dom.debug.logInfo('RigidBodyCollection: ');
	}
}));

//	### RigidBody ###
x3dom.registerNodeType("RigidBody", "X3DNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.RigidBody.superClass.call(this, ctx);
	this.addField_SFFloat(ctx, 'angularDampingFactor', 0.001);
	this.addField_SFVec3f(ctx, 'angularVelocity', 0,0,0);
	this.addField_SFBool(ctx, 'autoDamp', false);
	this.addField_SFBool(ctx, 'autoDisable', false);
	this.addField_SFVec3f(ctx, 'centerOfMass', 0,0,0);
	this.addField_SFFloat(ctx, 'disableAngularSpeed', 0);
	this.addField_SFFloat(ctx, 'disableLinearSpeed', 0);
	this.addField_SFFloat(ctx, 'disableTime', 0);
	this.addField_SFBool(ctx, 'enabled', true);		
	this.addField_SFVec3f(ctx, 'finiteRotationAxis', 0,0,0);
	this.addField_SFBool(ctx, 'fixed', false);
	this.addField_MFVec3f(ctx, 'forces', []);
	this.addField_MFFloat(ctx, 'inertia', [1, 0, 0, 0, 1, 0, 0, 0, 1]);
	this.addField_SFFloat(ctx, 'linearDampingFactor', 0.001);
	this.addField_SFVec3f(ctx, 'linearVelocity', 0,0,0);
	this.addField_SFFloat(ctx, 'mass', 1);
	this.addField_SFRotation(ctx, 'orientation', 0,0,1,0);
	this.addField_SFVec3f(ctx, 'position', 0,0,0);
	this.addField_MFVec3f(ctx, 'torques', []);
	this.addField_SFBool(ctx, 'useFiniteRotation', false);
	this.addField_SFBool(ctx, 'useGlobalGravity', true);
	this.addField_MFNode('massDensityModel', x3dom.nodeTypes.Shape);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
	this.addField_MFNode('geometry', x3dom.nodeTypes.X3DNBodyCollidableNode);
},{
	nodeChanged: function(){
		if(!this._cf.geometry.nodes){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.X3DNBodyCollidableNode)){
					this._cf.geometry = this._xmlNode.children[x];
				}
			}
		}
		if(!this._cf.massDensityModel.nodes){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.Shape)){
					this._cf.massDensityModel = this._xmlNode.children[x];
				}
			}
		}
	   x3dom.debug.logInfo('RigidBody: ');
	}
}));

//	### X3DNBodyCollidableNode ###
x3dom.registerNodeType("X3DNBodyCollidableNode", "X3DChildNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.X3DNBodyCollidableNode.superClass.call(this, ctx);
	this.addField_SFBool(ctx, 'enabled', true);	
	this.addField_SFRotation(ctx, 'rotation', 0,0,1,0);
	this.addField_SFVec3f(ctx, 'translation', 0,0,0);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
	   x3dom.debug.logInfo('X3DNBodyCollidableNode: ');
	}
}));

//	### CollidableShape ###
x3dom.registerNodeType("CollidableShape", "X3DNBodyCollidableNode ", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.CollidableShape.superClass.call(this, ctx);
	this.addField_SFBool(ctx, 'enabled', true);	
	this.addField_SFRotation(ctx, 'rotation', 0,0,1,0);
	this.addField_SFVec3f(ctx, 'translation', 0,0,0);
	this.addField_SFNode('transform', x3dom.nodeTypes.Transform);
	this.addField_SFNode('shape', x3dom.nodeTypes.Shape);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		if(!this._cf.transform.node){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.Transform)){
					this._cf.transform = this._xmlNode.children[x];
				}
			}
		}
		if(!this._cf.shape.node){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.Shape)){
					this._cf.shape = this._xmlNode.children[x];
				}
			}
		}
	   x3dom.debug.logInfo('CollidableShape: ');
	}
}));

//	### CollisionCollection ###
x3dom.registerNodeType("CollisionCollection", "X3DChildNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.CollisionCollection.superClass.call(this, ctx);
	this.addField_SFFloat(ctx, 'bounce', 0);
	this.addField_SFBool(ctx, 'enabled', true);
	this.addField_SFVec2f(ctx, 'frictionCoefficients', 0,0);
	this.addField_SFFloat(ctx, 'minBounceSpeed', 0.1);
	this.addField_SFVec2f(ctx, 'slipFactors', 0,0);
	this.addField_SFFloat(ctx, 'softnessConstantForceMix', 0.0001);
	this.addField_SFFloat(ctx, 'softnessErrorCorrection', 0.8);
	this.addField_SFVec2f(ctx, 'surfaceSpeed', 0,0);
	this.addField_MFNode('collidables', x3dom.nodeTypes.X3DNBodyCollidableNode);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		if(!this._cf.collidables.nodes){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.X3DNBodyCollidableNode)){
					this._cf.collidables = this._xmlNode.children[x];
				}
			}
		}
		x3dom.debug.logInfo('CollisionCollection: ');
	}
}));

//	### CollisionSensor ###
x3dom.registerNodeType("CollisionSensor", "X3DSensorNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.CollisionSensor.superClass.call(this, ctx);
	this.addField_SFBool(ctx, 'enabled', true);
	this.addField_SFNode('collider', x3dom.nodeTypes.CollisionCollection);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		if(!this._cf.collider.node){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.CollisionCollection)){
					this._cf.collider = this._xmlNode.children[x];
				}
			}
		}
		x3dom.debug.logInfo('CollisionSensor: ');
	}
}));

//	### X3DRigidJointNode ###
x3dom.registerNodeType("X3DRigidJointNode", "X3DNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.X3DRigidJointNode.superClass.call(this, ctx);
	this.addField_SFString(ctx, 'forceOutput', "");
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		if(!this._cf.body1.node){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.RigidBody)){
					this._cf.body1 = this._xmlNode.children[x];
				}
			}
		}
		if(!this._cf.body2.node){
			for(var x in this._xmlNode.children){
				if(x3dom.isa(this._xmlNode.children[x]._x3domNode, x3dom.nodeTypes.RigidBody)){
					this._cf.body2 = this._xmlNode.children[x];
				}
			}
		}
		x3dom.debug.logInfo('X3DRigidJointNode: ');
	}
}));

//	### BallJoint ###
x3dom.registerNodeType("BallJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.BallJoint.superClass.call(this, ctx);
	this.addField_SFVec3f(ctx, 'anchorPoint', 0,0,0);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('BallJoint: ');
	}
}));

//	### MotorJoint ###
x3dom.registerNodeType("MotorJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.MotorJoint.superClass.call(this, ctx);
	this.addField_SFFloat(ctx, 'axis1Angle', 0);
	this.addField_SFFloat(ctx, 'axis1Torque', 0);
	this.addField_SFFloat(ctx, 'axis2Angle', 0);
	this.addField_SFFloat(ctx, 'axis2Torque', 0);
	this.addField_SFFloat(ctx, 'axis3Angle', 0);
	this.addField_SFFloat(ctx, 'axis3Torque', 0);
	this.addField_SFInt32(ctx, 'enabledAxes', 1);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFVec3f(ctx, 'motor1Axis', 0,0,0);
	this.addField_SFVec3f(ctx, 'motor2Axis', 0,0,0);
	this.addField_SFVec3f(ctx, 'motor3Axis', 0,0,0);
	this.addField_SFFloat(ctx, 'stop1Bounce', 0);
	this.addField_SFFloat(ctx, 'stop1ErrorCorrection', 0.8);
	this.addField_SFFloat(ctx, 'stop2Bounce', 0);
	this.addField_SFFloat(ctx, 'stop2ErrorCorrection', 0.8);
	this.addField_SFFloat(ctx, 'stop3Bounce', 0);
	this.addField_SFFloat(ctx, 'stop3ErrorCorrection', 0.8);
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('MotorJoint: ');
	}
}));

//	### SliderJoint ###
x3dom.registerNodeType("SliderJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.SliderJoint.superClass.call(this, ctx);
	this.addField_SFVec3f(ctx, 'axis', 0,1,0);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFFloat(ctx, 'maxSeparation', 1);
	this.addField_SFFloat(ctx, 'minSeparation', 0);
	this.addField_SFFloat(ctx, 'stopBounce', 0);
	this.addField_SFFloat(ctx, 'stopErrorCorrection', 1);
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('SliderJoint: ');
	}
}));

//	### UniversalJoint ###
x3dom.registerNodeType("UniversalJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.UniversalJoint.superClass.call(this, ctx);
	this.addField_SFVec3f(ctx, 'anchorPoint', 0,0,0);
	this.addField_SFVec3f(ctx, 'axis1', 0,0,0);
	this.addField_SFVec3f(ctx, 'axis2', 0,0,0);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFFloat(ctx, 'stop1Bounce', 0);
	this.addField_SFFloat(ctx, 'stop1ErrorCorrection', 0.8);
	this.addField_SFFloat(ctx, 'stop2Bounce', 0);
	this.addField_SFFloat(ctx, 'stop2ErrorCorrection', 0.8);
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('UniversalJoint: ');
	}
}));

//	### SingleAxisHingeJoint ###
x3dom.registerNodeType("SingleAxisHingeJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.SingleAxisHingeJoint.superClass.call(this, ctx);
	this.addField_SFVec3f(ctx, 'anchorPoint', 0,0,0);
	this.addField_SFVec3f(ctx, 'axis', 0,0,0);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFFloat(ctx, 'maxAngle', 90);
	this.addField_SFFloat(ctx, 'minAngle', -90);
	this.addField_SFFloat(ctx, 'stopBounce', 0);
	this.addField_SFFloat(ctx, 'stopErrorCorrection', 0.8);
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('SingleAxisHingeJoint: ');
	}
}));

//	### DoubleAxisHingeJoint ###
x3dom.registerNodeType("DoubleAxisHingeJoint", "X3DRigidJointNode", defineClass(x3dom.nodeTypes.X3DNode, function(ctx){
	x3dom.nodeTypes.DoubleAxisHingeJoint.superClass.call(this, ctx);
	this.addField_SFVec3f(ctx, 'anchorPoint', 0,0,0);
	this.addField_SFVec3f(ctx, 'axis1', 0,0,0);
	this.addField_SFVec3f(ctx, 'axis2', 0,0,0);
	this.addField_SFFloat(ctx, 'desiredAngularVelocity1', 0);
	this.addField_SFFloat(ctx, 'desiredAngularVelocity2', 0);
	this.addField_SFString(ctx, 'forceOutput', "NONE");
	this.addField_SFFloat(ctx, 'maxAngle1', 90);
	this.addField_SFFloat(ctx, 'minAngle1', -90);
	this.addField_SFFloat(ctx, 'maxTorque1', 0);
	this.addField_SFFloat(ctx, 'maxTorque2', 0);
	this.addField_SFFloat(ctx, 'stopBounce1', 0);
	this.addField_SFFloat(ctx, 'stopConstantForceMix1', 0.001);
	this.addField_SFFloat(ctx, 'stopErrorCorrection1', 0.8);
	this.addField_SFFloat(ctx, 'suspensionErrorCorrection', 0.8);
	this.addField_SFFloat(ctx, 'suspensionForce', 0);
	this.addField_SFNode('body1', x3dom.nodeTypes.RigidBody);
	this.addField_SFNode('body2', x3dom.nodeTypes.RigidBody);
	this.addField_MFNode('metadata', x3dom.nodeTypes.X3DMetadataObject);
},{
	nodeChanged: function(){
		x3dom.debug.logInfo('DoubleAxisHingeJoint: ');
	}
}));

//	###############################################################
//	###############################################################
//	###############################################################

function X3DCollidableShape(){
	var CollidableShape = new x3dom.fields.SFNode();
	var RigidBody = new x3dom.fields.SFNode();
	var RigidBodyCollection = new x3dom.fields.SFNode();
	var CollisionCollection = new x3dom.fields.SFNode();
	var Transform = new x3dom.fields.SFNode();
	var RB_setup = new x3dom.fields.MFBoolean();
	var T_setup = new x3dom.fields.MFBoolean();
	var CC_setup = new x3dom.fields.MFBoolean();
	var createRigid = new x3dom.fields.MFBoolean();
	var isMotor = new x3dom.fields.MFBoolean();
	var torque = new x3dom.fields.SFVec3f();
	var isInline = new x3dom.fields.MFBoolean();
	var inlineExternalTransform = new x3dom.fields.SFNode();
	var inlineInternalTransform = new x3dom.fields.SFNode();
}

function X3DJoint(){
	var createJoint = new x3dom.fields.MFBoolean();
	var Joint = [];
}

//	###############################################################
//	###############################################################
//	###############################################################

(function(){

	var CollidableShapes = [], JointShapes = [], bulletWorld, x3dWorld, initScene, main, updateRigidbodies, MakeUpdateList, X3DRigidBodyComponents, CreateX3DCollidableShape, 
		UpdateTransforms, CreateRigidbodies, rigidbodies = [], mousePickObject, mousePos = new x3dom.fields.SFVec3f(), drag = false, interactiveTransforms = [], UpdateRigidbody, 
		intervalVar, building_constraints = true, ParseX3DElement, InlineObjectList, inline_x3dList = [], inlineLoad = false, completeJointSetup = false;

	function ParseX3DElement(){
	
		for(var cv in x3dom.canvases){
			for(var sc in x3dom.canvases[cv].x3dElem.children){
				if(x3dom.isa(x3dom.canvases[cv].x3dElem.children[sc]._x3domNode, x3dom.nodeTypes.Scene)){
					x3dWorld = x3dom.canvases[cv].x3dElem.children[sc];
				}
			}
		}

		for (var i in x3dWorld.children){
			if(x3dom.isa(x3dWorld.children[i]._x3domNode, x3dom.nodeTypes.Transform)){
				if(x3dom.isa(x3dWorld.children[i]._x3domNode._cf.children.nodes[0]._xmlNode._x3domNode, x3dom.nodeTypes.Inline)){
					if(inline_x3dList.length == 0){
						inline_x3dList.push(x3dWorld.children[i]);
					}
					else{
						for(var n in inline_x3dList){
							if(inline_x3dList[n]._x3domNode._DEF.toString() == x3dWorld.children[i]._x3domNode._DEF.toString()){
								break;
							}
							else{
								if(n == inline_x3dList.length-1){
									inline_x3dList.push(x3dWorld.children[i]);
								}
							}
							
						}
					}
				}
			}
			if(x3dom.isa(x3dWorld.children[i]._x3domNode, x3dom.nodeTypes.Group)){
				for(var all in x3dWorld.children[i].childNodes){
					CreateX3DCollidableShape(x3dWorld.children[i].childNodes[all], null);
				}
			}
			else{
				CreateX3DCollidableShape(x3dWorld.children[i], null);
			}
		}
		
	}
	
	function CreateX3DCollidableShape(a, b){

		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.CollidableShape)){
			var X3D_CS = new X3DCollidableShape;
			CollidableShapes.push(X3D_CS);
			X3D_CS.CollidableShape = a;
			X3D_CS.createRigid = true;
			X3D_CS.RB_setup = false;
			X3D_CS.T_setup = false;
			X3D_CS.CC_setup = false;
			X3D_CS.isMotor = false;
			X3D_CS.torque = new x3dom.fields.SFVec3f(0,0,0);
			X3D_CS.isInline = false;
			X3D_CS.inlineExternalTransform = null;
			X3D_CS.Transform = a._x3domNode._cf.transform;
			if(b){
				X3D_CS.isInline = true;	
				X3D_CS.inlineExternalTransform = b;
			}
		}
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.RigidBodyCollection)){
			for(var ea in a._x3domNode._cf.joints.nodes){
				if(x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.BallJoint) || x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.UniversalJoint)
				|| x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.SliderJoint) || x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.MotorJoint)
				|| x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.SingleAxisHingeJoint) || x3dom.isa(a._x3domNode._cf.joints.nodes[ea], x3dom.nodeTypes.DoubleAxisHingeJoint)){
					var X3D_J = new X3DJoint;
					X3D_J.createJoint = true;
					X3D_J.Joint = a._x3domNode._cf.joints.nodes[ea];							
					JointShapes.push(X3D_J);
				}
			}
			completeJointSetup = true;
		}	
		if(inlineLoad){
			X3DRigidBodyComponents(a);
		}
		if(a.parentNode){
			for (var ea in a.parentNode.children){
				if(a.parentNode && a.parentNode.children.hasOwnProperty(ea) && a.parentNode.children[ea]){
					if(x3dom.isa(a.parentNode.children[ea]._x3domNode, x3dom.nodeTypes.Group)){
						for(var all in a.parentNode.children[ea].childNodes){
							if(a.parentNode.children[ea].childNodes.hasOwnProperty(all) && a.parentNode.children[ea].childNodes[all]){
								X3DRigidBodyComponents(a.parentNode.children[ea].childNodes[all]);
							}
						}
					}
					else{
						X3DRigidBodyComponents(a.parentNode.children[ea]);
					}
				}
			}
		}
	}

	function X3DRigidBodyComponents(a){
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.CollisionSensor)){
			for(var ea in a._x3domNode._cf.collider._x3domNode._cf.collidables.nodes){
				for(var cs in CollidableShapes){
					if(!CollidableShapes[cs].CC_setup && CollidableShapes[cs].CollidableShape._x3domNode._DEF == a._x3domNode._cf.collider._x3domNode._cf.collidables.nodes[ea]._DEF){
						CollidableShapes[cs].CC_setup = true;
						CollidableShapes[cs].CollisionCollection = a._x3domNode._cf.collider;
					}	
				}
			}
		}
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.CollisionCollection)){
			for(var ea in a._x3domNode._cf.collidables.nodes){
				for(var cs in CollidableShapes){
					if(!CollidableShapes[cs].CC_setup && CollidableShapes[cs].CollidableShape._x3domNode._DEF == a._x3domNode._cf.collidables.nodes[ea]._DEF){
						CollidableShapes[cs].CC_setup = true;
						CollidableShapes[cs].CollisionCollection = a._x3domNode._cf.collider;
					}	
				}
			}
		}
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.Transform)){
			for(var cs in CollidableShapes){
				if(!CollidableShapes[cs].T_setup && CollidableShapes[cs].Transform._x3domNode._DEF == a._x3domNode._DEF){
					CollidableShapes[cs].T_setup = true;
					CollidableShapes[cs].inlineInternalTransform = null;
					interactiveTransforms.push(a);
					if(!CollidableShapes[cs].inlineInternalTransform && CollidableShapes[cs].isInline){
						CollidableShapes[cs].inlineInternalTransform = a;
					}
				}
			}
		}	
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.RigidBodyCollection)){
			for(var ea in a._x3domNode._cf.bodies.nodes){
				for(var eac in a._x3domNode._cf.bodies.nodes[ea]._cf.geometry.nodes){
					for(var cs in CollidableShapes){
						if(!CollidableShapes[cs].RB_setup && CollidableShapes[cs].CollidableShape._x3domNode._DEF == a._x3domNode._cf.bodies.nodes[ea]._cf.geometry.nodes[eac]._DEF){
							CollidableShapes[cs].RB_setup = true;
							CollidableShapes[cs].RigidBody = a._x3domNode._cf.bodies.nodes[ea];
							CollidableShapes[cs].RigidBodyCollection = a;
						}
					}
				}
			}
		}
		
	}


//	################################################################
//	###################	INITIALIZE BULLET WORLD	####################
//	################################################################
	
	initScene = function(){
		var collisionConfiguration, dispatcher, overlappingPairCache, solver, WorldGravity = new x3dom.fields.SFVec3f();
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		overlappingPairCache = new Ammo.btDbvtBroadphase();
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		bulletWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, overlappingPairCache, solver, collisionConfiguration );
		bulletWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
	};	
		
//	###############################################################
//	###########	CREATE&DESCRIBE RIGIDBODIES IN BULLET	###########
//	###############################################################

	CreateRigidbodies = function(){
		var mass, startTransform, localInertia, sphereShape, boxShape, cylinderShape, coneShape, indexedfacesetShape, centerOfMass, motionState, rbInfo, 
		sphereAmmo, boxAmmo, cylinderAmmo, coneAmmo, indexedfacesetAmmo;
		
		building_constraints = true;
		for (var cs in CollidableShapes){
			if(CollidableShapes[cs].CC_setup && CollidableShapes[cs].T_setup && CollidableShapes[cs].RB_setup && CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._xmlNode.nodeName && CollidableShapes[cs].createRigid == true){
				switch (CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._xmlNode.nodeName.toLowerCase())
				{
					case "sphere":{
						var sphere = CollidableShapes[cs];
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){ 
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							CollidableShapes[cs].Transform._x3domNode._vf.rotation = CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation;
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						sphereShape = new Ammo.btSphereShape(CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.radius);
						sphereShape.calculateLocalInertia(mass, localInertia);
						sphereShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						motionState = new Ammo.btDefaultMotionState(startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, sphereShape, localInertia);
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						sphereAmmo = new Ammo.btRigidBody(rbInfo);
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							sphereAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);	
						}
						else{
							sphereAmmo.setDamping(0,0);
						}
						sphereAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																			CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																			CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						sphereAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																			CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																			CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							sphereAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							sphereAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							sphereAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							sphereAmmo.setFriction(0);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							sphereAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							sphereAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																		CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																		CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							sphereAmmo.setFlags(0);
						}
						else{
							sphereAmmo.setFlags(1);
						}
						sphereAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody(sphereAmmo);
							sphereAmmo.geometry = sphere;
							rigidbodies.splice(UpdateRigidbody,1,sphereAmmo);
						}
						else{
							bulletWorld.addRigidBody(sphereAmmo);
							sphereAmmo.geometry = sphere;
							rigidbodies.push(sphereAmmo);
						}
					}
					break;
					
					case "box":{
					
						var box = CollidableShapes[cs];
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setBasis(CollidableShapes[cs].RigidBody._vf.inertia);
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						
						var zeroRot = new x3dom.fields.Quaternion(0,0,0,1);
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						boxShape = new Ammo.btBoxShape(new Ammo.btVector3( 	CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.size.x/2, 
																			CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.size.y/2, 
																			CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.size.z/2));
						localInertia = new Ammo.btVector3(0,0,0);
						boxShape.calculateLocalInertia(mass, localInertia);
						boxShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						motionState = new Ammo.btDefaultMotionState(startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, boxShape, localInertia);
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						boxAmmo = new Ammo.btRigidBody(rbInfo);
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							boxAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);	
						}
						else{
							boxAmmo.setDamping(0,0);
						}
						boxAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																		CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																		CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						boxAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																		CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																		CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							boxAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							boxAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							boxAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							boxAmmo.setFriction(1);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							boxAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							boxAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							boxAmmo.setFlags(0);
						}
						else{
							boxAmmo.setFlags(1);
						}
						boxAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody(boxAmmo);
							boxAmmo.geometry = box;
							rigidbodies.splice(UpdateRigidbody,1,boxAmmo);
						}
						else{
							bulletWorld.addRigidBody(boxAmmo);
							boxAmmo.geometry = box;
							rigidbodies.push(boxAmmo);
						}
					}
					break;

					case "cylinder":{
						var cylinder = CollidableShapes[cs];
						
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){ 
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setBasis(CollidableShapes[cs].RigidBody._vf.inertia);
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							CollidableShapes[cs].Transform._x3domNode._vf.rotation = CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation;
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						cylinderShape = new Ammo.btCylinderShape(new Ammo.btVector3(CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.radius, 
																					CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.height/2, 
																					CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.radius));
						cylinderShape.calculateLocalInertia(mass, localInertia);
						cylinderShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						motionState = new Ammo.btDefaultMotionState(startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, cylinderShape, localInertia);
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						cylinderAmmo = new Ammo.btRigidBody(rbInfo);
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							cylinderAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);
						}
						else{
							cylinderAmmo.setDamping(0,0);
						}
						cylinderAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																			CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																			CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						cylinderAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																			CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																			CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							cylinderAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							cylinderAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							cylinderAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							cylinderAmmo.setFriction(1);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							cylinderAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							cylinderAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																		CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																		CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							cylinderAmmo.setFlags(0);
						}
						else{
							cylinderAmmo.setFlags(1);
						}
						cylinderAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody( cylinderAmmo );
							cylinderAmmo.geometry = cylinder;
							rigidbodies.splice(UpdateRigidbody,1,cylinderAmmo);
						}
						else{
							bulletWorld.addRigidBody( cylinderAmmo );
							cylinderAmmo.geometry = cylinder;
							rigidbodies.push( cylinderAmmo );
						}
					}
					break;

					case "cone":{
					
						var cone = CollidableShapes[cs];
						
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){ 
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setBasis(CollidableShapes[cs].RigidBody._vf.inertia);
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							CollidableShapes[cs].Transform._x3domNode._vf.rotation = CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation;
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						coneShape = new Ammo.btConeShape(	CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.radius, 
															CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._vf.height);
						coneShape.setConeUpIndex(1);
						coneShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						coneShape.calculateLocalInertia( mass, localInertia );
						motionState = new Ammo.btDefaultMotionState( startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, coneShape, localInertia );
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						coneAmmo = new Ammo.btRigidBody( rbInfo );
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							coneAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);
						}
						else{
							coneAmmo.setDamping(0,0);
						}
						coneAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																		CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																		CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						coneAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																		CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																		CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							coneAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							coneAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							coneAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							coneAmmo.setFriction(1);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							coneAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							coneAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							coneAmmo.setFlags(0);
						}
						else{
							coneAmmo.setFlags(1);
						}
						coneAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody( coneAmmo );
							coneAmmo.geometry = cone;
							rigidbodies.splice(UpdateRigidbody,1,coneAmmo);
						}
						else{
							bulletWorld.addRigidBody( coneAmmo );
							coneAmmo.geometry = cone;
							rigidbodies.push( coneAmmo );
						}
					}
					break;

					case "indexedfaceset":{
						var indexedfaceset = CollidableShapes[cs];
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){ 
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setBasis(CollidableShapes[cs].RigidBody._vf.inertia);
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							CollidableShapes[cs].Transform._x3domNode._vf.rotation = CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation;
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						var convexHullShape = new Ammo.btConvexHullShape();
						for(var p in CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point){
							convexHullShape.addPoint(new Ammo.btVector3(CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].z), 
																		true);										
						}
						var compoundShape = new Ammo.btCompoundShape();
						compoundShape.addChildShape(startTransform, convexHullShape);
						compoundShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						compoundShape.createAabbTreeFromChildren();
						compoundShape.updateChildTransform(0, new Ammo.btTransform(new Ammo.btQuaternion(0,0,0,1), new Ammo.btVector3(0,0,0)),true);
						compoundShape.calculateLocalInertia( mass, localInertia );
						motionState = new Ammo.btDefaultMotionState( startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compoundShape, localInertia );
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						indexedfacesetAmmo = new Ammo.btRigidBody( rbInfo );
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							indexedfacesetAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);
						}
						else{
							indexedfacesetAmmo.setDamping(0,0);
						}
						indexedfacesetAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																					CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																					CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						indexedfacesetAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																					CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																					CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							indexedfacesetAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							indexedfacesetAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							indexedfacesetAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							indexedfacesetAmmo.setFriction(1);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							indexedfacesetAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							indexedfacesetAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																				CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																				CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							indexedfacesetAmmo.setFlags(0);
						}
						else{
							indexedfacesetAmmo.setFlags(1);
						}
						indexedfacesetAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody( indexedfacesetAmmo );
							indexedfacesetAmmo.geometry = indexedfaceset;
							rigidbodies.splice(UpdateRigidbody,1,indexedfacesetAmmo);
						}
						else{
							bulletWorld.addRigidBody( indexedfacesetAmmo );
							indexedfacesetAmmo.geometry = indexedfaceset;
							rigidbodies.push( indexedfacesetAmmo );
						}
					}
					break;

					case "indexedtriangleset":{
					
						var triangleset = CollidableShapes[cs];
						if(!CollidableShapes[cs].RigidBody._vf.enabled || CollidableShapes[cs].RigidBody._vf.fixed){ 
							mass = 0;
						}
						else{
							mass = CollidableShapes[cs].RigidBody._vf.mass;
						}
						startTransform = new Ammo.btTransform();
						startTransform.setIdentity();
						startTransform.setBasis(CollidableShapes[cs].RigidBody._vf.inertia);
						startTransform.setOrigin(new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z));
						if(CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z == 0
						&& CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w == 1
						){
							startTransform.setRotation(new Ammo.btQuaternion(0,0,1,0));
						}
						else{
							CollidableShapes[cs].Transform._x3domNode._vf.rotation = CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation;
							startTransform.setRotation(new Ammo.btQuaternion(	CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.x, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.y, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.z, 
																				CollidableShapes[cs].CollidableShape._x3domNode._vf.rotation.w));
						}
						if(CollidableShapes[cs].RigidBody._vf.centerOfMass != null){
							centerOfMass = 	new Ammo.btTransform(startTransform.getRotation(), 
											new Ammo.btVector3(	CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.x+CollidableShapes[cs].RigidBody._vf.centerOfMass.x, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.y+CollidableShapes[cs].RigidBody._vf.centerOfMass.y, 
																CollidableShapes[cs].CollidableShape._x3domNode._vf.translation.z+CollidableShapes[cs].RigidBody._vf.centerOfMass.z));
						}
						else{
							centerOfMass = startTransform;
						}
						if(CollidableShapes[cs].RigidBody._vf.inertia){
							if(CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2] ==
								CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5] ==
								CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8] == 1){
								localInertia = new Ammo.btVector3(0,0,0);
							}
							else{
								localInertia = new Ammo.btVector3(
									CollidableShapes[cs].RigidBody._vf.inertia[0] + CollidableShapes[cs].RigidBody._vf.inertia[1] + CollidableShapes[cs].RigidBody._vf.inertia[2], 
									CollidableShapes[cs].RigidBody._vf.inertia[3] + CollidableShapes[cs].RigidBody._vf.inertia[4] + CollidableShapes[cs].RigidBody._vf.inertia[5],
									CollidableShapes[cs].RigidBody._vf.inertia[6] + CollidableShapes[cs].RigidBody._vf.inertia[7] + CollidableShapes[cs].RigidBody._vf.inertia[8]);
							}
						}
						else{
							localInertia = new Ammo.btVector3(0,0,0);
						}
						var convexHullShape = new Ammo.btConvexHullShape();
						for(var p in CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point){
							convexHullShape.addPoint(new Ammo.btVector3(CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].x, 
																		CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].y, 
																		CollidableShapes[cs].CollidableShape._x3domNode._cf.shape._x3domNode._cf.geometry.node._cf.coord.node._vf.point[p].z), true);
						}
						var compoundShape = new Ammo.btCompoundShape();
						compoundShape.addChildShape(startTransform, convexHullShape);
						compoundShape.setMargin(CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.contactSurfaceThickness);
						compoundShape.createAabbTreeFromChildren();
						compoundShape.updateChildTransform(0, new Ammo.btTransform(new Ammo.btQuaternion(0,0,0,1), new Ammo.btVector3(0,0,0)),true);
						compoundShape.calculateLocalInertia( mass, localInertia );
						motionState = new Ammo.btDefaultMotionState( startTransform);
						rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, compoundShape, localInertia );
						rbInfo.m_friction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.x;
						rbInfo.m_rollingFriction = CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y;
						trianglesetAmmo = new Ammo.btRigidBody( rbInfo );
						if(CollidableShapes[cs].RigidBody._vf.autoDamp){
							trianglesetAmmo.setDamping(CollidableShapes[cs].RigidBody._vf.linearDampingFactor, CollidableShapes[cs].RigidBody._vf.angularDampingFactor);	
						}
						else{
							trianglesetAmmo.setDamping(0,0);
						}
						trianglesetAmmo.setAngularVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.angularVelocity.x, 
																				CollidableShapes[cs].RigidBody._vf.angularVelocity.y, 
																				CollidableShapes[cs].RigidBody._vf.angularVelocity.z));
						trianglesetAmmo.setLinearVelocity(new Ammo.btVector3(	CollidableShapes[cs].RigidBody._vf.linearVelocity.x, 
																				CollidableShapes[cs].RigidBody._vf.linearVelocity.y, 
																				CollidableShapes[cs].RigidBody._vf.linearVelocity.z));
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce != null){
							trianglesetAmmo.setRestitution(CollidableShapes[cs].CollisionCollection._x3domNode._vf.bounce);
						}
						else{
							trianglesetAmmo.setRestitution(1.0);
						}
						if(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients != null){
							trianglesetAmmo.setFriction(CollidableShapes[cs].CollisionCollection._x3domNode._vf.frictionCoefficients.y);
						}
						else{
							trianglesetAmmo.setFriction(1);
						}
						if(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed && CollidableShapes[cs].RigidBody._vf.disableAngularSpeed){
							trianglesetAmmo.setSleepingThresholds(CollidableShapes[cs].RigidBody._vf.disableLinearSpeed, CollidableShapes[cs].RigidBody._vf.disableAngularSpeed);
						}
						if(CollidableShapes[cs].RigidBody._vf.useGlobalGravity){
							trianglesetAmmo.setGravity(new Ammo.btVector3(	CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.x, 
																			CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.y, 
																			CollidableShapes[cs].RigidBodyCollection._x3domNode._vf.gravity.z));
							trianglesetAmmo.setFlags(0);
						}
						else{
							trianglesetAmmo.setFlags(1);
						}
						trianglesetAmmo.setCenterOfMassTransform(centerOfMass);
						if(UpdateRigidbody != null){
							bulletWorld.removeRigidBody(rigidbodies[UpdateRigidbody]);
							bulletWorld.addRigidBody( trianglesetAmmo );
							trianglesetAmmo.geometry = triangleset;
							rigidbodies.splice(UpdateRigidbody,1,trianglesetAmmo);
						}
						else{
							bulletWorld.addRigidBody( trianglesetAmmo );
							trianglesetAmmo.geometry = triangleset;
							rigidbodies.push( trianglesetAmmo );
						}
					}
					break;
				}		
			}
		}
		CreateJoints();
		MakeUpdateList();
	};

	
//	###############################################################
//	############	CREATE&DESCRIBE JOINTS IN BULLET	###########
//	###############################################################

	CreateJoints = function(){
		if(UpdateRigidbody != null){
			var constraintNum = bulletWorld.getNumConstraints();
			for(cn = constraintNum; cn >= 0; cn--){
				var constr = bulletWorld.getConstraint(cn);
				bulletWorld.removeConstraint(constr);
			}
		}
		for(var js in JointShapes){
			if(JointShapes[js].Joint._xmlNode.nodeName){
				switch(JointShapes[js].Joint._xmlNode.nodeName.toLowerCase()){
					case "balljoint":{
						for (var j in rigidbodies) {
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
							}
						}
						if(object1 && object2){
							var newBallJoint = new Ammo.btPoint2PointConstraint(object1, object2, 
								new Ammo.btVector3(JointShapes[js].Joint._vf.anchorPoint.x, JointShapes[js].Joint._vf.anchorPoint.y, JointShapes[js].Joint._vf.anchorPoint.z), 
								new Ammo.btVector3(-JointShapes[js].Joint._vf.anchorPoint.x, -JointShapes[js].Joint._vf.anchorPoint.y, -JointShapes[js].Joint._vf.anchorPoint.z));
							bulletWorld.addConstraint(newBallJoint);
						}
					}
					break;

					case "sliderjoint":{
						for ( j = 0; j < rigidbodies.length; j++ ) {	
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
							}
						}
						if(object1 && object2){
							var newSliderJoint = new Ammo.btSliderConstraint(object1, object2, object1.getWorldTransform(), object2.getWorldTransform(), true);
							newSliderJoint.setFrames(object1.getWorldTransform(), object2.getWorldTransform());
							bulletWorld.addConstraint(newSliderJoint);
						}
					}
					break;
					
					case "universaljoint":{
						for ( j = 0; j < rigidbodies.length; j++ ) {
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
							}
						}
						if(object1 && object2){
							var newUniversalJoint = new btUniversalConstraint(object1, object2, 
													new Ammo.btVector3(JointShapes[js].Joint._vf.anchorPoint.x, JointShapes[js].Joint._vf.anchorPoint.y, JointShapes[js].Joint._vf.anchorPoint.z), 
													new Ammo.btVector3(JointShapes[js].Joint._vf.axis1.x, JointShapes[js].Joint._vf.axis1.y, JointShapes[js].Joint._vf.axis1.z),  
													new Ammo.btVector3(JointShapes[js].Joint._vf.axis2.x, JointShapes[js].Joint._vf.axis2.y, JointShapes[js].Joint._vf.axis2.z));
							bulletWorld.addConstraint( newUniversalJoint );
						}
					}	
					break;	

					case "motorjoint":{
						for ( j = 0; j < rigidbodies.length; j++ ) {
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
								rigidbodies[j].geometry.isMotor = true;
								rigidbodies[j].geometry.torque = new x3dom.fields.SFVec3f(	JointShapes[js].Joint._vf.axis2Torque * JointShapes[js].Joint._vf.motor2Axis.x, 
																							JointShapes[js].Joint._vf.axis2Torque * JointShapes[js].Joint._vf.motor2Axis.y, 
																							JointShapes[js].Joint._vf.axis2Torque * JointShapes[js].Joint._vf.motor2Axis.z);
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
								rigidbodies[j].geometry.isMotor = true;
								rigidbodies[j].geometry.torque = new x3dom.fields.SFVec3f(	JointShapes[js].Joint._vf.axis3Torque * JointShapes[js].Joint._vf.motor3Axis.x, 
																							JointShapes[js].Joint._vf.axis3Torque * JointShapes[js].Joint._vf.motor3Axis.y, 
																							JointShapes[js].Joint._vf.axis3Torque * JointShapes[js].Joint._vf.motor3Axis.z);
							}
						}
						if(object1 && object2){
							var newGearJoint = new btGeneric6DofConstraint(	object1, object2, object1.getWorldTransform(), object2.getWorldTransform(), true );
							/*
							For each axis, if
							lower limit = upper limit, The axis is locked
							lower limit < upper limit, The axis is limited between the specified values
							lower limit > upper limit, The axis is free and has no limits 
							*/
							if(JointShapes[js].Joint._vf.motor3Axis.x != 0){	
								newGearJoint.getRotationalLimitMotor(0).m_enableMotor = true;
								newGearJoint.getRotationalLimitMotor(0).m_targetVelocity = JointShapes[js].Joint._vf.axis1Torque;
								newGearJoint.getRotationalLimitMotor(0).m_maxMotorForce = 100.0;
								newGearJoint.getRotationalLimitMotor(0).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(0).m_hiLimit = 10.0;
							}
							else{
								newGearJoint.getRotationalLimitMotor(0).m_enableMotor = false;
								newGearJoint.getRotationalLimitMotor(0).m_targetVelocity = 0;
								newGearJoint.getRotationalLimitMotor(0).m_maxMotorForce = 0.0;
								newGearJoint.getRotationalLimitMotor(0).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(0).m_hiLimit = 0.0;
							}
							if(JointShapes[js].Joint._vf.motor3Axis.y != 0){
								newGearJoint.getRotationalLimitMotor(1).m_enableMotor = true;
								newGearJoint.getRotationalLimitMotor(1).m_targetVelocity = JointShapes[js].Joint._vf.axis2Torque;
								newGearJoint.getRotationalLimitMotor(1).m_maxMotorForce = 100.0;
								newGearJoint.getRotationalLimitMotor(1).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(1).m_hiLimit = 10.0;
							}
							else{
								newGearJoint.getRotationalLimitMotor(1).m_enableMotor = false;
								newGearJoint.getRotationalLimitMotor(1).m_targetVelocity = 0;
								newGearJoint.getRotationalLimitMotor(1).m_maxMotorForce = 0.0;
								newGearJoint.getRotationalLimitMotor(1).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(1).m_hiLimit = 0.0;
							}
							if(JointShapes[js].Joint._vf.motor3Axis.z != 0){
								newGearJoint.getRotationalLimitMotor(2).m_enableMotor = true;
								newGearJoint.getRotationalLimitMotor(2).m_targetVelocity = JointShapes[js].Joint._vf.axis3Torque;
								newGearJoint.getRotationalLimitMotor(2).m_maxMotorForce = 100.0;
								newGearJoint.getRotationalLimitMotor(2).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(2).m_hiLimit = 10.0;
							}
							else{
								newGearJoint.getRotationalLimitMotor(2).m_enableMotor = false;
								newGearJoint.getRotationalLimitMotor(2).m_targetVelocity = 0;
								newGearJoint.getRotationalLimitMotor(2).m_maxMotorForce = 0.0;
								newGearJoint.getRotationalLimitMotor(2).m_loLimit = 0.0;
								newGearJoint.getRotationalLimitMotor(2).m_hiLimit = 0.0;
							}
							newGearJoint.enableFeedback(true);
							bulletWorld.addConstraint( newGearJoint, true);
						}
					}		
					break;	

					case "singleaxishingejoint":{
						for ( j = 0; j < rigidbodies.length; j++ ) {
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
							}
						}
						if(object1 && object2){
							var newSingleHingeJoint = new btHingeConstraint(object1, object2, 
																			new Ammo.btVector3(JointShapes[js].Joint._vf.anchorPoint.x, JointShapes[js].Joint._vf.anchorPoint.y, JointShapes[js].Joint._vf.anchorPoint.z), 
																			new Ammo.btVector3(-JointShapes[js].Joint._vf.anchorPoint.x, -JointShapes[js].Joint._vf.anchorPoint.y, -JointShapes[js].Joint._vf.anchorPoint.z), 
																			new Ammo.btVector3(JointShapes[js].Joint._vf.axis.x, JointShapes[js].Joint._vf.axis.y, JointShapes[js].Joint._vf.axis.z), 
																			new Ammo.btVector3(JointShapes[js].Joint._vf.axis.x, JointShapes[js].Joint._vf.axis.y, JointShapes[js].Joint._vf.axis.z), 
																			false );
							newSingleHingeJoint.setLimit(JointShapes[js].Joint._vf.minAngle, JointShapes[js].Joint._vf.maxAngle, 0.9, 0.3, 1.0);
							bulletWorld.addConstraint(newSingleHingeJoint);
						}
					}
					break;

					case "doubleaxishingejoint":{
						for ( j = 0; j < rigidbodies.length; j++ ) {
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body1.node._DEF){
								var object1 = rigidbodies[j];
							}
							if(rigidbodies[j].geometry.RigidBody._DEF && rigidbodies[j].geometry.RigidBody._DEF == JointShapes[js].Joint._cf.body2.node._DEF){
								var object2 = rigidbodies[j];
							}
						}
						if(object1 && object2){
							var newDoubleHingeJoint = new btHingeConstraint(object1, object2, 
								new Ammo.btVector3(JointShapes[js].Joint._vf.anchorPoint.x, JointShapes[js].Joint._vf.anchorPoint.y, JointShapes[js].Joint._vf.anchorPoint.z),  
								new Ammo.btVector3(-JointShapes[js].Joint._vf.anchorPoint.x, -JointShapes[js].Joint._vf.anchorPoint.y, -JointShapes[js].Joint._vf.anchorPoint.z), 
								new Ammo.btVector3(JointShapes[js].Joint._vf.axis1.x, JointShapes[js].Joint._vf.axis1.y, JointShapes[js].Joint._vf.axis1.z), 
								new Ammo.btVector3(JointShapes[js].Joint._vf.axis2.x, JointShapes[js].Joint._vf.axis2.y, JointShapes[js].Joint._vf.axis2.z), 
								false );
							newDoubleHingeJoint.setLimit(JointShapes[js].Joint._vf.minAngle1, JointShapes[js].Joint._vf.maxAngle1, 0.9, 0.3, 1.0);	
							bulletWorld.addConstraint( newDoubleHingeJoint, true);
						}
					}
					break;
				}
			}
		}
	};
		
	MakeUpdateList = function(){
		for(var r = 0; r < rigidbodies.length; r++ ){
			if(!drag && rigidbodies[r].geometry.createRigid){
				rigidbodies[r].geometry.createRigid = false;
			}
		}
		for(var r = 0; r < JointShapes.length; r++ ){
			if(!drag && JointShapes[r].createJoint){
				JointShapes[r].createJoint = false;
			}
		}
		building_constraints = false;
	}

	CreateInteractiveObjects = function(){
		x3dWorld.parentElement.addEventListener('mouseup', MouseControlStop, false);
		x3dWorld.parentElement.addEventListener('mousedown', MouseControlStart, false);	
		x3dWorld.parentElement.addEventListener('mousemove', MouseControlMove, false);
		for(var t in interactiveTransforms){
			for(var cs in CollidableShapes){
				if(CollidableShapes[cs].Transform._x3domNode._DEF == interactiveTransforms[t]._x3domNode._DEF){
					if(!CollidableShapes[cs].RigidBody._vf.fixed){
						interactiveTransforms[t].addEventListener('mousedown', MouseControlStart, false);
						interactiveTransforms[t].addEventListener('mousemove', MouseControlMove, false);
						new x3dom.Moveable(x3dWorld.parentElement, interactiveTransforms[t], null, 0);
					}
				}
			}
		}
		
	}

	UpdateConstraints = function(){
		if(drag && building_constraints == false){
			for(var r = 0; r < rigidbodies.length; r++){
				if(rigidbodies[r].geometry.Transform){
					if(rigidbodies[r].geometry.Transform._x3domNode._DEF == mousePickObject._DEF){
						UpdateRigidbody = r;
					}
				}
			}
			CreateRigidbodies();
		}
		else{
			clearInterval(intervalVar);
			CreateRigidbodies();
			UpdateRigidbody = null;
			mousePickObject = null;
		}
	}	
		
	MouseControlMove = function(e){
		if(e.hitPnt){
			mousePos = new x3dom.fields.SFVec3f.parse(e.hitPnt);
		}
	}	
		
	MouseControlStart = function(e){
		if(!drag){
			drag = true;
			if(e.hitObject){
				for(var pn in e.hitObject._x3domNode._parentNodes){
					if(x3dom.isa(e.hitObject._x3domNode._parentNodes[pn], x3dom.nodeTypes.Transform)){
						mousePickObject = e.hitObject._x3domNode._parentNodes[pn];
					}
				}
			}
			if(mousePickObject){
				for (var r in rigidbodies){
					if(rigidbodies[r] && rigidbodies[r].geometry.Transform._x3domNode._DEF == mousePickObject._DEF){
						rigidbodies[r].activate(false);
						rigidbodies[r].geometry.createRigid = true;
						intervalVar=setInterval(UpdateConstraints, 1);
					}
				}
			}
			else{
				drag = false;
				mousePickObject = null;
			}
		}
	}	
		
	MouseControlStop = function(e){
		if(drag){
			drag = false;
		}
	}	
	
//	###############################################################
//	####################	UPDATE RIGIDBODIES	###################
//	##########	CALCULATE RIGIDBODY POSITION&ROTATION	###########

	updateRigidbodies = function(){
		bulletWorld.stepSimulation(1/60, 100);
		var r, transform = new Ammo.btTransform(), origin = new Ammo.btVector3(), rotation = new Ammo.btQuaternion();
		for(r = 0; r < rigidbodies.length; r++){
			if(!rigidbodies[r].geometry.createRigid){
				rigidbodies[r].getMotionState().getWorldTransform( transform );
				origin = transform.getOrigin();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.x = origin.x();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.y = origin.y();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.z = origin.z();
				rotation = transform.getRotation();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.rotation.x = rotation.x();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.rotation.y = rotation.y();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.rotation.z = rotation.z();
				rigidbodies[r].geometry.CollidableShape._x3domNode._vf.rotation.w = rotation.w();
			}
			else{
				if(mousePos){
					//CALCULATE RIGIDBODY POSITION FROM MOUSE POSITION
					rigidbodies[r].getMotionState().getWorldTransform( transform );
					transform.setOrigin(new Ammo.btVector3(mousePos.x, mousePos.y, mousePos.z));
					origin = transform.getOrigin();
					rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.x = origin.x();
					rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.y = origin.y();
					rigidbodies[r].geometry.CollidableShape._x3domNode._vf.translation.z = origin.z();
				}
			}
			
			//SET RIGIDBODY POSITION + ROTATION
			for (var x in x3dWorld.children){
				if(x3dWorld.children[x].nodeName && x3dWorld.children[x].nodeName.toLowerCase() == "group"){
					for(var c in x3dWorld.children[x].childNodes){
						if(x3dWorld.children[x].childNodes.hasOwnProperty(c) && x3dWorld.children[x].childNodes[c] != null){
							UpdateTransforms(x3dWorld.children[x].childNodes[c], rigidbodies[r]);
						}
					}
				}
				else{
					UpdateTransforms(x3dWorld.children[x], rigidbodies[r]);
				}	
			}

			if(rigidbodies[r].geometry.isMotor == true){
				rigidbodies[r].applyTorque(new Ammo.btVector3(rigidbodies[r].geometry.torque.x, rigidbodies[r].geometry.torque.y, rigidbodies[r].geometry.torque.z));
			}
			if(rigidbodies[r].geometry.RigidBody._vf.torques.length > 0){
				for(var num in rigidbodies[r].geometry.RigidBody._vf.torques){
					rigidbodies[r].applyTorque(new Ammo.btVector3(rigidbodies[r].geometry.RigidBody._vf.torques[num].x, rigidbodies[r].geometry.RigidBody._vf.torques[num].y, rigidbodies[r].geometry.RigidBody._vf.torques[num].z));
				}
			}
		}
	}
		
	function UpdateTransforms(a, b){
		if(x3dom.isa(a._x3domNode, x3dom.nodeTypes.Transform)){
			if(b.geometry.isInline){
				if(a == b.geometry.inlineExternalTransform){
					if(b.geometry.inlineInternalTransform){
						b.geometry.inlineInternalTransform.translation = b.geometry.CollidableShape._x3domNode._vf.translation;
						b.geometry.inlineInternalTransform.rotation = b.geometry.CollidableShape._x3domNode._vf.rotation;
					}
				}
			}
			else{
				if(b.geometry.Transform){
					if(b.geometry.Transform._x3domNode._DEF == a._x3domNode._DEF){
						a.translation = b.geometry.CollidableShape._x3domNode._vf.translation;
						a.rotation = b.geometry.CollidableShape._x3domNode._vf.rotation;	
					}
				}
			}
		}	
	}

	function InlineObjectList(a, b){
		for(var x in a.children){
			CreateX3DCollidableShape(a.children[x], b);
		}
		b.translation = new x3dom.fields.SFVec3f(0,0,0);
	}

	main = function main(){
		updateRigidbodies();
		window.requestAnimFrame(main);
		if(document.readyState === "complete" && !inlineLoad && inline_x3dList.length){
			for(var x in inline_x3dList){
				if(inline_x3dList[x]._x3domNode._cf.children.nodes[0]._xmlNode._x3domNode._childNodes[0]){
					inlineLoad = true;
					InlineObjectList(inline_x3dList[x]._x3domNode._cf.children.nodes[0]._xmlNode._x3domNode._childNodes[0]._xmlNode, inline_x3dList[x]);
					CreateRigidbodies();
				}
			}
		}
	};
		
	window.onload = function(){
		ParseX3DElement();
		initScene();
		requestAnimFrame(main);
		if(!inline_x3dList.length){
			CreateRigidbodies();
		}
		CreateInteractiveObjects();
	}
	
})();


window['requestAnimFrame'] = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){ 
			window.setTimeout(callback, 1000 / 60);
          };
})();
