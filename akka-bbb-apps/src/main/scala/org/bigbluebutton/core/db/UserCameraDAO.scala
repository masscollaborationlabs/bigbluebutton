package org.bigbluebutton.core.db

import org.bigbluebutton.core.models.{RegisteredUser, UserState, VoiceUserState, WebcamStream}
import slick.jdbc.PostgresProfile.api._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.{Failure, Success, Try}

case class UserCameraDbModel(
        streamId:        String,
        userId:        String,
)

class UserCameraDbTableDef(tag: Tag) extends Table[UserCameraDbModel](tag, None, "user_camera") {
  override def * = (
    streamId, userId) <> (UserCameraDbModel.tupled, UserCameraDbModel.unapply)
  val streamId = column[String]("streamId", O.PrimaryKey)
  val userId = column[String]("userId")
}

object UserCameraDAO {
  //  val usersTable = TableQuery[UserTableDef]

  def insert(webcam: WebcamStream) = {
    DatabaseConnection.db.run(
      TableQuery[UserCameraDbTableDef].forceInsert(
        UserCameraDbModel(
          streamId = webcam.streamId,
            userId = webcam.userId
        )
      )
    ).onComplete {
        case Success(rowsAffected) => {
          println(s"$rowsAffected row(s) inserted!")
        }
        case Failure(e)            => println(s"Error inserting webcam: $e")
      }
  }

  def delete(streamId: String) = {
    DatabaseConnection.db.run(
      TableQuery[UserCameraDbTableDef]
        .filter(_.streamId === streamId)
        .delete
    ).onComplete {
        case Success(rowsAffected) => println(s"Webcam ${streamId} deleted")
        case Failure(e)            => println(s"Error deleting webcam: $e")
      }
  }


}
